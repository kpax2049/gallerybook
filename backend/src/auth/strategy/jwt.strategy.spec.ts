import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let prisma: { user: { findUnique: jest.Mock } };

  beforeEach(() => {
    prisma = { user: { findUnique: jest.fn() } };
    const config = {
      getOrThrow: jest.fn().mockReturnValue('access-secret'),
    };
    strategy = new JwtStrategy(
      config as unknown as ConfigService,
      prisma as unknown as PrismaService,
    );
  });

  it('accepts an active user when token versions match', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 1,
      email: 'user@example.com',
      hash: 'secret',
      status: UserStatus.active,
      tokenVersion: 3,
    });

    await expect(
      strategy.validate({ sub: 1, email: 'user@example.com', tv: 3 }),
    ).resolves.toEqual({
      id: 1,
      email: 'user@example.com',
      status: UserStatus.active,
      tokenVersion: 3,
    });
  });

  it.each([undefined, 2])(
    'rejects a missing or stale token version (%s)',
    async (tv) => {
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        hash: 'secret',
        status: UserStatus.active,
        tokenVersion: 3,
      });

      await expect(
        strategy.validate({ sub: 1, email: 'user@example.com', tv }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    },
  );

  it('rejects missing users', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      strategy.validate({ sub: 1, email: 'user@example.com', tv: 1 }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('preserves pending-user rejection', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 1,
      hash: 'secret',
      status: UserStatus.inactive,
      tokenVersion: 3,
    });

    await expect(
      strategy.validate({ sub: 1, email: 'user@example.com', tv: 3 }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
