import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const hash = await bcrypt.hash('password123', 12);

  // Admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@matchai.hk' },
    update: {},
    create: {
      email: 'admin@matchai.hk',
      passwordHash: hash,
      role: UserRole.ADMIN,
      isVerified: true,
      mfaEnabled: false,
      admin: { create: {} },
    },
  });

  // Employer
  const employerUser = await prisma.user.upsert({
    where: { email: 'employer@matchai.hk' },
    update: {},
    create: {
      email: 'employer@matchai.hk',
      passwordHash: hash,
      role: UserRole.EMPLOYER,
      isVerified: true,
      employer: {
        create: {
          fullName: 'Chan Tai Man',
          district: 'Kowloon Tong',
          plan: 'basic',
        },
      },
    },
  });

  // Broker
  const brokerUser = await prisma.user.upsert({
    where: { email: 'broker@matchai.hk' },
    update: {},
    create: {
      email: 'broker@matchai.hk',
      passwordHash: hash,
      role: UserRole.BROKER,
      isVerified: true,
      broker: {
        create: {
          agencyName: 'Happy Home Agency',
          licenseNumber: 'EAL-12345',
        },
      },
    },
  });

  console.log('Seed complete:');
  console.log('  admin@matchai.hk / password123');
  console.log('  employer@matchai.hk / password123');
  console.log('  broker@matchai.hk / password123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
