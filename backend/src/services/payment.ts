import { Prisma } from '@prisma/client';
import { prisma } from '../db/client.js';
import { logger } from './logger.js';
import { AppError } from '../middleware/errorHandler.js';

const PAYMENT_DELAY_MS = 1000;
const FAILURE_RATE = 0.05;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function processMockPayment(
  reservationId: string,
  userId: string,
  paymentMethodId?: string,
) {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
  });

  if (!reservation) {
    throw new AppError(404, 'Reservation not found', 'NOT_FOUND');
  }

  if (reservation.userId !== userId) {
    throw new AppError(403, 'Access denied', 'FORBIDDEN');
  }

  const paymentIntentId = reservation.paymentIntentId;

  // Idempotency: if payment already recorded, return existing outcome
  const existingAttempt = await prisma.paymentAttempt.findUnique({
    where: { paymentIntentId },
  });

  if (existingAttempt) {
    logger.info('payment_idempotent', 'Returning cached payment result', {
      paymentIntentId,
      status: existingAttempt.status,
    });

    const updated = await prisma.reservation.findUnique({ where: { id: reservationId } });
    return {
      success: existingAttempt.status === 'succeeded',
      reservation: updated,
      idempotent: true,
    };
  }

  if (reservation.status !== 'pending_payment') {
    throw new AppError(409, `Reservation is ${reservation.status}`, 'INVALID_STATE');
  }

  if (reservation.expiresAt < new Date()) {
    await prisma.reservation.update({
      where: { id: reservationId },
      data: { status: 'expired' },
    });
    throw new AppError(409, 'Reservation expired', 'EXPIRED');
  }

  logger.info('payment_initiated', 'Mock payment started', {
    reservationId,
    paymentIntentId,
    paymentMethodId,
  });

  await sleep(PAYMENT_DELAY_MS);

  const shouldFail = Math.random() < FAILURE_RATE;

  try {
    return await prisma.$transaction(async (tx) => {
      const current = await tx.reservation.findUnique({ where: { id: reservationId } });

      if (!current) {
        throw new AppError(404, 'Reservation not found', 'NOT_FOUND');
      }

      if (current.status !== 'pending_payment') {
        const attempt = await tx.paymentAttempt.findUnique({ where: { paymentIntentId } });
        if (attempt) {
          const updated = await tx.reservation.findUnique({ where: { id: reservationId } });
          return {
            success: attempt.status === 'succeeded',
            reservation: updated,
            idempotent: true,
          };
        }
        throw new AppError(409, `Reservation is ${current.status}`, 'INVALID_STATE');
      }

      if (shouldFail) {
        await tx.paymentAttempt.create({
          data: {
            paymentIntentId,
            reservationId,
            status: 'failed',
          },
        });

        await tx.reservation.update({
          where: { id: reservationId },
          data: { status: 'failed' },
        });

        logger.warn('payment_failed', 'Mock payment failed (simulated)', {
          reservationId,
          paymentIntentId,
        });

        const updated = await tx.reservation.findUnique({ where: { id: reservationId } });
        return { success: false, reservation: updated, idempotent: false };
      }

      // Re-check seat is still claimable before confirming
      const seatConflict = await tx.reservation.findFirst({
        where: {
          seatId: current.seatId,
          status: 'confirmed',
          id: { not: reservationId },
        },
      });

      if (seatConflict) {
        await tx.paymentAttempt.create({
          data: {
            paymentIntentId,
            reservationId,
            status: 'failed',
          },
        });

        await tx.reservation.update({
          where: { id: reservationId },
          data: { status: 'failed' },
        });

        logger.warn('payment_seat_taken', 'Seat taken during payment', {
          reservationId,
          seatId: current.seatId,
        });

        const updated = await tx.reservation.findUnique({ where: { id: reservationId } });
        return { success: false, reservation: updated, idempotent: false, reason: 'SEAT_TAKEN' };
      }

      await tx.paymentAttempt.create({
        data: {
          paymentIntentId,
          reservationId,
          status: 'succeeded',
        },
      });

      const confirmed = await tx.reservation.update({
        where: { id: reservationId },
        data: { status: 'confirmed' },
      });

      await tx.seat.update({
        where: { id: current.seatId },
        data: { version: { increment: 1 } },
      });

      logger.info('payment_succeeded', 'Reservation confirmed', {
        reservationId,
        paymentIntentId,
        seatId: current.seatId,
      });

      return { success: true, reservation: confirmed, idempotent: false };
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;

    // Handle unique constraint race on payment_attempts (idempotency)
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      const attempt = await prisma.paymentAttempt.findUnique({ where: { paymentIntentId } });
      const updated = await prisma.reservation.findUnique({ where: { id: reservationId } });
      return {
        success: attempt?.status === 'succeeded',
        reservation: updated,
        idempotent: true,
      };
    }

    logger.error('payment_error', 'Payment processing failed', {
      reservationId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new AppError(500, 'Payment processing failed', 'PAYMENT_ERROR');
  }
}
