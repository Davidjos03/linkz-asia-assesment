import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../db/client.js';
import { logger } from '../services/logger.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { loginRateLimit } from '../middleware/rateLimit.js';
import { requireAuth, getSessionUser } from '../middleware/auth.js';

const router = Router();

const DEMO_EMAIL = 'test@example.com';
const DEMO_PASSWORD = 'password123';

router.post(
  '/login',
  loginRateLimit,
  asyncHandler(async (req, res) => {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if (!email || !password) {
      throw new AppError(400, 'Email and password are required');
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new AppError(400, 'Invalid email format');
    }

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user && email === DEMO_EMAIL) {
      const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
      user = await prisma.user.create({
        data: { email, passwordHash },
      });
      logger.info('user_created', 'Demo user auto-created', { email });
    }

    if (!user) {
      throw new AppError(401, 'Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      logger.warn('login_failed', 'Invalid password', { email });
      throw new AppError(401, 'Invalid credentials');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastActive: new Date() },
    });

    req.session.user = { id: user.id, email: user.email };

    logger.info('login_success', 'User logged in', { userId: user.id, email });

    res.json({ user: { id: user.id, email: user.email } });
  }),
);

router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const user = getSessionUser(req);
    req.session.destroy((err) => {
      if (err) {
        logger.error('logout_failed', 'Session destroy failed', { error: err.message });
        res.status(500).json({ error: 'Logout failed' });
        return;
      }
      res.clearCookie('connect.sid');
      logger.info('logout_success', 'User logged out', { userId: user?.id });
      res.json({ ok: true });
    });
  }),
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const sessionUser = getSessionUser(req)!;
    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { id: true, email: true, createdAt: true },
    });

    if (!user) {
      req.session.destroy(() => {});
      throw new AppError(401, 'Session invalid');
    }

    res.json({ user });
  }),
);

export default router;
