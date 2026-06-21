import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role } from '@prisma/client';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not configured.');
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

const username = (process.env.SUPERADMIN_USERNAME || 'superadmin').trim().toLowerCase();
const email = (process.env.SUPERADMIN_EMAIL || 'superadmin@zentra.local').trim().toLowerCase();
const generatedPassword = `${randomBytes(15).toString('base64url')}!9Aa`;
const password = process.env.SUPERADMIN_PASSWORD || generatedPassword;

try {
  const existingSuperadmin = await prisma.user.findFirst({
    where: { role: Role.SUPERADMIN },
    select: { username: true, email: true },
  });

  if (existingSuperadmin) {
    console.log(`Superadmin already exists: ${existingSuperadmin.username} (${existingSuperadmin.email})`);
    process.exitCode = 0;
  } else {
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.create({
      data: {
        username,
        email,
        password: passwordHash,
        fullName: process.env.SUPERADMIN_FULL_NAME || 'Zentra Superadmin',
        role: Role.SUPERADMIN,
      },
    });

    console.log('Initial superadmin created.');
    console.log(`Username: ${username}`);
    console.log(`Email: ${email}`);
    console.log(`Temporary password: ${password}`);
    console.log('Change this password from Team Management after the first login.');
  }
} finally {
  await prisma.$disconnect();
}
