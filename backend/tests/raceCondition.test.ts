import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import express from 'express';
import session from 'express-session';
import { PrismaClient } from '@prisma/client';
import { startReservation } from '../src/services/reservation.js';

const prisma = new PrismaClient();
const TEST_EMAIL = 'race-test@example.com';

describe('Seat claim race condition', () => {
  let userAId: string;
  let userBId: string;

  beforeAll(async () => {
    await prisma.reservation.deleteMany();
    await prisma.paymentAttempt.deleteMany();
    await prisma.user.deleteMany({ where: { email: { in: [TEST_EMAIL, 'race-b@example.com'] } } });

    await prisma.seat.upsert({ where: { id: 1 }, update: {}, create: { id: 1, row: 1, col: 1 } });

    const hash = await bcrypt.hash('password123', 10);
    const userA = await prisma.user.create({ data: { email: TEST_EMAIL, passwordHash: hash } });
    const userB = await prisma.user.create({
      data: { email: 'race-b@example.com', passwordHash: hash },
    });
    userAId = userA.id;
    userBId = userB.id;
  });

  afterAll(async () => {
    await prisma.reservation.deleteMany();
    await prisma.paymentAttempt.deleteMany();
    await prisma.user.deleteMany({ where: { email: { in: [TEST_EMAIL, 'race-b@example.com'] } } });
    await prisma.$disconnect();
  });

  it('allows only one concurrent claim on the same seat', async () => {
    const results = await Promise.allSettled([
      startReservation(userAId, 1),
      startReservation(userBId, 1),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);

    const active = await prisma.reservation.count({
      where: {
        seatId: 1,
        status: { in: ['pending_payment', 'confirmed'] },
        expiresAt: { gt: new Date() },
      },
    });

    expect(active).toBe(1);
  });
});

describe('Health check', () => {
  it('returns ok', async () => {
    const app = express();
    app.get('/health', (_req, res) => res.json({ status: 'ok' }));

    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
