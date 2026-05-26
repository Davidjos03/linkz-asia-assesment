import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth, getSessionUser } from '../middleware/auth.js';
import { paymentRateLimit } from '../middleware/rateLimit.js';
import { processMockPayment } from '../services/payment.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

router.post(
  '/mock',
  requireAuth,
  paymentRateLimit,
  asyncHandler(async (req, res) => {
    const user = getSessionUser(req)!;
    const reservationId = typeof req.body.reservationId === 'string' ? req.body.reservationId : '';
    const paymentMethodId =
      typeof req.body.paymentMethodId === 'string' ? req.body.paymentMethodId : undefined;

    if (!reservationId) {
      throw new AppError(400, 'reservationId is required');
    }

    const result = await processMockPayment(reservationId, user.id, paymentMethodId);

    res.json({
      success: result.success,
      idempotent: result.idempotent ?? false,
      reason: 'reason' in result ? result.reason : undefined,
      reservation: result.reservation
        ? {
            id: result.reservation.id,
            seatId: result.reservation.seatId,
            status: result.reservation.status,
          }
        : null,
    });
  }),
);

export default router;
