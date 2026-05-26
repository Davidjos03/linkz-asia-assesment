import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const seats = [
    { id: 1, row: 1, col: 1 },
    { id: 2, row: 1, col: 2 },
    { id: 3, row: 1, col: 3 },
  ];

  for (const seat of seats) {
    await prisma.seat.upsert({
      where: { id: seat.id },
      update: {},
      create: seat,
    });
  }

  const demoEmail = 'test@example.com';
  const existing = await prisma.user.findUnique({ where: { email: demoEmail } });

  if (!existing) {
    await prisma.user.create({
      data: {
        email: demoEmail,
        passwordHash: await bcrypt.hash('password123', 10),
      },
    });
    console.log('Created demo user: test@example.com / password123');
  }

  console.log('Seeded 3 seats and demo user');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
