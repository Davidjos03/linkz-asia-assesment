import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { getSeatsWithStatus } from '../services/reservation.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const seats = await getSeatsWithStatus();
    res.json({ seats });
  }),
);

export default router;
