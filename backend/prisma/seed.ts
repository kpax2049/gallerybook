import { PrismaClient, Role } from '@prisma/client';
import * as argon from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const username = process.env.ADMIN_USERNAME ?? 'admin';
  const fullName = process.env.ADMIN_FULL_NAME ?? 'Gallerybook Admin';

  if (!email || !password) {
    const message =
      'Skipping admin seed. Set ADMIN_EMAIL and ADMIN_PASSWORD to bootstrap an admin user.';

    if (process.env.NODE_ENV === 'production') {
      throw new Error(message);
    }

    console.warn(message);
    return;
  }

  if (password.length < 8) {
    throw new Error('ADMIN_PASSWORD must be at least 8 characters.');
  }

  const hash = await argon.hash(password);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      hash,
      role: Role.ADMIN,
      fullName,
      username,
    },
    create: {
      email,
      hash,
      role: Role.ADMIN,
      fullName,
      username,
      profile: {
        create: {
          avatarUrl: null,
        },
      },
    },
  });

  await prisma.profile.upsert({
    where: { userId: admin.id },
    update: {},
    create: {
      userId: admin.id,
      avatarUrl: null,
    },
  });

  console.log(`Admin user ready: ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
