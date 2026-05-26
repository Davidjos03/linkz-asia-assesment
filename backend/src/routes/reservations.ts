import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth, getSessionUser } from '../middleware/auth.js';
import { startReservation, getReservationForUser } from '../services/reservation.js';

const router = Router();

router.post(
  '/start',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = getSessionUser(req)!;
    const seatId = Number(req.body.seatId);

    const reservation = await startReservation(user.id, seatId);

    res.status(201).json({
      reservation: {
        id: reservation.id,
        seatId: reservation.seatId,
        status: reservation.status,
        expiresAt: reservation.expiresAt,
        paymentIntentId: reservation.paymentIntentId,
      },
    });
  }),
);

router.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = getSessionUser(req)!;
    const reservation = await getReservationForUser(String(req.params.id), user.id);

    res.json({
      reservation: {
        id: reservation.id,
        seatId: reservation.seatId,
        status: reservation.status,
        expiresAt: reservation.expiresAt,
        createdAt: reservation.createdAt,
      },
    });
  }),
);

export default router;
