import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import authRoutes from './routes/auth.js';
import seatsRoutes from './routes/seats.js';
import reservationsRoutes from './routes/reservations.js';
import paymentsRoutes from './routes/payments.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiRateLimit } from './middleware/rateLimit.js';
import { logger } from './services/logger.js';
import { expireStaleReservations } from './services/reservation.js';
import { prisma } from './db/client.js';

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret-change-me';
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;
const isDev = process.env.NODE_ENV !== 'production';

function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return true;
  if (origin === FRONTEND_URL) return true;
  // Allow any localhost port in development (Vite may shift ports)
  if (isDev && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
  return false;
}

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, isAllowedOrigin(origin));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: '10kb' }));
app.use(apiRateLimit);

app.use(
  session({
    store: new PrismaSessionStore(prisma, {
      checkPeriod: 2 * 60 * 1000,
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined,
    }),
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: NINETY_DAYS_MS,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    },
  }),
);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/logs', (_req, res) => {
  res.json({ logs: logger.getRecent(100) });
});

app.use('/api/auth', authRoutes);
app.use('/api/seats', seatsRoutes);
app.use('/api/reservations', reservationsRoutes);
app.use('/api/payments', paymentsRoutes);

app.use(errorHandler);

async function start() {
  setInterval(() => {
    expireStaleReservations().catch((err) => {
      logger.error('expire_job_failed', 'Failed to expire reservations', {
        error: err instanceof Error ? err.message : String(err),
      });
    });
  }, 60_000);

  app.listen(PORT, () => {
    logger.info('server_started', `Backend listening on port ${PORT}`, {
      frontendUrl: FRONTEND_URL,
    });
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export default app;
