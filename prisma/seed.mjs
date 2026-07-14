import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  AuditAction,
  AuditStatus,
  PrismaClient,
  Role,
  UserStatus,
} from '@prisma/client';

const PASSWORD_POLICY_MESSAGE =
  'SUPERADMIN_PASSWORD must be at least 12 characters and contain uppercase, lowercase, number, and symbol.';

function isStrongPassword(password) {
  return (
    password.length >= 12 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

function readRequiredProductionValue(name, { trim = true } = {}) {
  const rawValue = process.env[name];
  if (!rawValue?.trim()) {
    throw new Error(`${name} is required for the production Super Admin bootstrap.`);
  }

  return trim ? rawValue.trim() : rawValue;
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not configured.');
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });
const isProductionBootstrap =
  process.argv.includes('--production') ||
  process.env.DEPLOYMENT_ENV?.trim().toLowerCase() === 'production' ||
  process.env.NODE_ENV?.trim().toLowerCase() === 'production';

try {
  const existingSuperadmin = await prisma.user.findFirst({
    where: { role: Role.SUPERADMIN },
    select: { id: true },
  });

  if (existingSuperadmin) {
    console.log('A Super Admin already exists. No bootstrap changes were applied.');
    process.exitCode = 0;
  } else {
    const generatedPassword = `${randomBytes(18).toString('base64url')}!9Aa`;
    const username = (
      isProductionBootstrap
        ? readRequiredProductionValue('SUPERADMIN_USERNAME')
        : process.env.SUPERADMIN_USERNAME || 'superadmin'
    )
      .trim()
      .toLowerCase();
    const email = (
      isProductionBootstrap
        ? readRequiredProductionValue('SUPERADMIN_EMAIL')
        : process.env.SUPERADMIN_EMAIL || 'superadmin@zentra.local'
    )
      .trim()
      .toLowerCase();
    const fullName = (
      isProductionBootstrap
        ? readRequiredProductionValue('SUPERADMIN_FULL_NAME')
        : process.env.SUPERADMIN_FULL_NAME || 'Zentra Superadmin'
    ).trim();
    const configuredPassword = process.env.SUPERADMIN_PASSWORD;
    const password = isProductionBootstrap
      ? readRequiredProductionValue('SUPERADMIN_PASSWORD', { trim: false })
      : configuredPassword || generatedPassword;

    if (!/^[a-z0-9][a-z0-9._-]{2,63}$/.test(username)) {
      throw new Error(
        'SUPERADMIN_USERNAME must be 3-64 characters using lowercase letters, numbers, periods, underscores, or hyphens.',
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('SUPERADMIN_EMAIL must be a valid email address.');
    }
    if (fullName.length < 2 || fullName.length > 255) {
      throw new Error('SUPERADMIN_FULL_NAME must be between 2 and 255 characters.');
    }
    if (!isStrongPassword(password)) {
      throw new Error(PASSWORD_POLICY_MESSAGE);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.$transaction(async (transaction) => {
      const user = await transaction.user.create({
        data: {
          username,
          email,
          passwordHash,
          fullName,
          role: Role.SUPERADMIN,
          status: UserStatus.ACTIVE,
          lastPasswordChangedAt: new Date(),
        },
        select: { id: true },
      });

      await transaction.passwordHistory.create({
        data: {
          userId: user.id,
          passwordHash,
        },
      });

      await transaction.auditLog.create({
        data: {
          userId: user.id,
          userName: username,
          userRole: Role.SUPERADMIN,
          action: AuditAction.CREATE,
          module: 'Authentication',
          description: 'Initial Super Admin account bootstrapped.',
          status: AuditStatus.SUCCESS,
          newValues: {
            username,
            email,
            fullName,
            role: Role.SUPERADMIN,
            status: UserStatus.ACTIVE,
          },
          metadata: {
            bootstrap: true,
            environment: isProductionBootstrap ? 'production' : 'development',
          },
          source: 'prisma-seed',
        },
      });
    });

    console.log('Initial superadmin created.');
    if (!isProductionBootstrap && !configuredPassword) {
      console.log(`Local development bootstrap password: ${password}`);
      console.log('Set SUPERADMIN_PASSWORD to avoid generating a new local bootstrap password.');
    }
    if (isProductionBootstrap) {
      console.log('Production credentials were not printed. Remove SUPERADMIN_PASSWORD from deployment configuration.');
    }
  }

  console.log('Seed complete. No bookings, payments, contracts, logs, services, packages, FAQs, or other business records were created.');
} finally {
  await prisma.$disconnect();
}
