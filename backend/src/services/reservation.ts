import { Prisma } from '@prisma/client';
import { prisma } from '../db/client.js';
import { logger } from './logger.js';
import { AppError } from '../middleware/errorHandler.js';
import { v4 as uuidv4 } from 'uuid';

const PENDING_PAYMENT_TTL_MS = 10 * 60 * 1000;

export async function expireStaleReservations(): Promise<number> {
  const now = new Date();
  const expired = await prisma.reservation.updateMany({
    where: {
      status: 'pending_payment',
      expiresAt: { lt: now },
    },
    data: { status: 'expired' },
  });

  if (expired.count > 0) {
    logger.info('reservations_expired', `Expired ${expired.count} pending reservations`);
  }

  return expired.count;
}

export async function startReservation(userId: string, seatId: number) {
  if (!Number.isInteger(seatId) || seatId < 1 || seatId > 3) {
    throw new AppError(400, 'Invalid seat id', 'INVALID_SEAT');
  }

  await expireStaleReservations();

  try {
    // Serializable transaction: SQLite acquires a write lock for the duration,
    // preventing two concurrent claims on the same seat.
    return await prisma.$transaction(async (tx) => {
      const seat = await tx.seat.findUnique({ where: { id: seatId } });

      if (!seat) {
        throw new AppError(404, 'Seat not found', 'SEAT_NOT_FOUND');
      }

      const blocking = await tx.reservation.findFirst({
        where: {
          seatId,
          status: { in: ['pending_payment', 'confirmed'] },
          OR: [
            { status: 'confirmed' },
            { status: 'pending_payment', expiresAt: { gt: new Date() } },
          ],
        },
      });

      if (blocking) {
        if (blocking.userId === userId && blocking.status === 'pending_payment') {
          return blocking;
        }
        throw new AppError(409, 'Seat is not available', 'SEAT_UNAVAILABLE');
      }

      const paymentIntentId = uuidv4();
      const reservation = await tx.reservation.create({
        data: {
          userId,
          seatId,
          status: 'pending_payment',
          paymentIntentId,
          expiresAt: new Date(Date.now() + PENDING_PAYMENT_TTL_MS),
        },
      });

      await tx.seat.update({
        where: { id: seatId },
        data: { version: { increment: 1 } },
      });

      logger.info('reservation_started', 'Reservation created', {
        reservationId: reservation.id,
        seatId,
        userId,
        paymentIntentId,
      });

      return reservation;
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('reservation_start_failed', 'Failed to start reservation', {
      seatId,
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new AppError(500, 'Could not start reservation', 'RESERVATION_FAILED');
  }
}

export async function getReservationForUser(reservationId: string, userId: string) {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { seat: true },
  });

  if (!reservation) {
    throw new AppError(404, 'Reservation not found', 'NOT_FOUND');
  }

  if (reservation.userId !== userId) {
    throw new AppError(403, 'Access denied', 'FORBIDDEN');
  }

  if (reservation.status === 'pending_payment' && reservation.expiresAt < new Date()) {
    await prisma.reservation.update({
      where: { id: reservationId },
      data: { status: 'expired' },
    });
    reservation.status = 'expired';
  }

  return reservation;
}

export async function getSeatsWithStatus() {
  await expireStaleReservations();

  const seats = await prisma.seat.findMany({ orderBy: { id: 'asc' } });
  const activeReservations = await prisma.reservation.findMany({
    where: {
      status: { in: ['pending_payment', 'confirmed'] },
      OR: [
        { status: 'confirmed' },
        { status: 'pending_payment', expiresAt: { gt: new Date() } },
      ],
    },
  });

  const bySeat = new Map(activeReservations.map((r) => [r.seatId, r.status]));

  return seats.map((seat) => ({
    id: seat.id,
    row: seat.row,
    col: seat.col,
    status: bySeat.has(seat.id)
      ? (bySeat.get(seat.id) === 'confirmed' ? 'reserved' : 'pending')
      : 'available',
  }));
}
