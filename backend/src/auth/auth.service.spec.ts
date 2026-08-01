import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import * as argon from 'argon2';
import { AuthService } from './auth.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserService } from 'src/users/user.service';
import { UserStatus } from '@prisma/client';

jest.mock('argon2', () => ({
  hash: jest.fn(),
  verify: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: {
      create: jest.Mock;
      findUnique: jest.Mock;
    };
  };
  let jwt: { signAsync: jest.Mock; sign: jest.Mock };
  let config: { get: jest.Mock };
  let users: {
    updatePasswordAfterChange: jest.Mock;
    findByIdWithPasswordHash: jest.Mock;
  };

  const mockSecrets = (key: string) =>
    ({
      JWT_SECRET: 'access-secret',
      JWT_REFRESH_SECRET: 'refresh-secret',
    })[key];

  beforeEach(() => {
    prisma = {
      user: {
        create: jest.fn(),
        findUnique: jest.fn(),
      },
    };
    jwt = {
      signAsync: jest.fn(),
      sign: jest.fn(),
    };
    config = {
      get: jest.fn(mockSecrets),
    };
    users = {
      updatePasswordAfterChange: jest.fn(),
      findByIdWithPasswordHash: jest.fn(),
    };

    service = new AuthService(
      prisma as unknown as PrismaService,
      jwt as unknown as JwtService,
      config as unknown as ConfigService,
      users as unknown as UserService,
    );

    (argon.hash as jest.Mock).mockReset();
    (argon.verify as jest.Mock).mockReset();
  });

  describe('signup', () => {
    it('hashes the password, creates an inactive user, and returns pending status', async () => {
      (argon.hash as jest.Mock).mockResolvedValue('hashed');
      prisma.user.create.mockResolvedValue({
        id: 1,
        email: 'user@example.com',
      });
      const result = await service.signup({
        email: 'user@example.com',
        password: 'pass',
        fullName: 'User',
        username: 'user',
      });

      expect(argon.hash).toHaveBeenCalledWith('pass');
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'user@example.com',
          hash: 'hashed',
          status: 'inactive',
        }),
      });
      expect(jwt.signAsync).not.toHaveBeenCalled();
      expect(result).toEqual({ status: 'pending' });
    });

    it('translates Prisma unique violations into ForbiddenException', async () => {
      (argon.hash as jest.Mock).mockResolvedValue('hash');
      prisma.user.create.mockRejectedValue(
        new PrismaClientKnownRequestError('duplicate', {
          code: 'P2002',
          clientVersion: '0.0.0',
        }),
      );

      await expect(
        service.signup({
          email: 'taken@example.com',
          password: 'pass',
          fullName: 'User',
          username: 'user',
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('signin', () => {
    it('throws when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.signin({ email: 'nope', password: 'pass' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws when password check fails', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'user@example.com',
        hash: 'stored',
        tokenVersion: 2,
      });
      (argon.verify as jest.Mock).mockResolvedValue(false);

      await expect(
        service.signin({ email: 'user@example.com', password: 'bad' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('returns access and refresh tokens for valid credentials', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'user@example.com',
        hash: 'stored',
        tokenVersion: 3,
        status: UserStatus.active,
      });
      (argon.verify as jest.Mock).mockResolvedValue(true);
      jwt.signAsync.mockResolvedValue('access');
      jwt.sign.mockReturnValue('refresh');

      await expect(
        service.signin({ email: 'user@example.com', password: 'ok' }),
      ).resolves.toEqual({
        status: 'active',
        accessToken: 'access',
        refreshToken: 'refresh',
      });

      expect(jwt.sign).toHaveBeenCalledWith(
        { sub: 1, tv: 3 },
        { secret: 'refresh-secret', expiresIn: '30d' },
      );
      expect(jwt.signAsync).toHaveBeenCalledWith(
        { sub: 1, email: 'user@example.com', tv: 3 },
        { secret: 'access-secret', expiresIn: '24h' },
      );
    });

    it('returns pending status without tokens for valid inactive credentials', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'user@example.com',
        hash: 'stored',
        tokenVersion: 3,
        status: UserStatus.inactive,
      });
      (argon.verify as jest.Mock).mockResolvedValue(true);

      await expect(
        service.signin({ email: 'user@example.com', password: 'ok' }),
      ).resolves.toEqual({ status: 'pending' });

      expect(jwt.signAsync).not.toHaveBeenCalled();
      expect(jwt.sign).not.toHaveBeenCalled();
    });
  });

  describe('signToken', () => {
    it('includes the provided token version without a database lookup', async () => {
      jwt.signAsync.mockResolvedValue('access');

      await expect(service.signToken(5, 'user@example.com', 6)).resolves.toBe(
        'access',
      );

      expect(prisma.user.findUnique).not.toHaveBeenCalled();
      expect(jwt.signAsync).toHaveBeenCalledWith(
        { sub: 5, email: 'user@example.com', tv: 6 },
        { secret: 'access-secret', expiresIn: '24h' },
      );
    });

    it('fetches the current token version when missing', async () => {
      prisma.user.findUnique.mockResolvedValue({ tokenVersion: 9 });
      jwt.signAsync.mockResolvedValue('access');

      await expect(service.signToken(1, 'user@example.com')).resolves.toBe(
        'access',
      );
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: { tokenVersion: true },
      });
      expect(jwt.signAsync).toHaveBeenCalledWith(
        { sub: 1, email: 'user@example.com', tv: 9 },
        { secret: 'access-secret', expiresIn: '24h' },
      );
    });
  });

  describe('signRefreshToken', () => {
    it('uses provided token version without hitting the database', async () => {
      jwt.sign.mockReturnValue('refresh');

      await expect(service.signRefreshToken(5, 6)).resolves.toBe('refresh');

      expect(prisma.user.findUnique).not.toHaveBeenCalled();
      expect(jwt.sign).toHaveBeenCalledWith(
        { sub: 5, tv: 6 },
        { secret: 'refresh-secret', expiresIn: '30d' },
      );
    });

    it('fetches tokenVersion when missing', async () => {
      prisma.user.findUnique.mockResolvedValue({ tokenVersion: 9 });
      jwt.sign.mockReturnValue('refresh');

      await expect(service.signRefreshToken(1)).resolves.toBe('refresh');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: { tokenVersion: true },
      });
      expect(jwt.sign).toHaveBeenCalledWith(
        { sub: 1, tv: 9 },
        { secret: 'refresh-secret', expiresIn: '30d' },
      );
    });
  });

  describe('changePassword', () => {
    it('rejects when new password matches current', async () => {
      await expect(
        service.changePassword(1, 'same', 'same'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.changePassword(1, 'old', 'new'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects when current password invalid', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 1, hash: 'stored' });
      (argon.verify as jest.Mock).mockResolvedValue(false);

      await expect(
        service.changePassword(1, 'old', 'new'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('updates password through user service when validation passes', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 1, hash: 'stored' });
      (argon.verify as jest.Mock).mockResolvedValue(true);
      (argon.hash as jest.Mock).mockResolvedValue('new-hash');
      users.updatePasswordAfterChange.mockResolvedValue({
        id: 1,
        tokenVersion: 4,
      });

      await expect(service.changePassword(1, 'old', 'new')).resolves.toEqual({
        success: true,
        tokenVersion: 4,
      });
      expect(users.updatePasswordAfterChange).toHaveBeenCalledWith(
        1,
        'new-hash',
      );
    });
  });

  describe('verifyCurrentPassword', () => {
    it('returns false when no hash exists', async () => {
      users.findByIdWithPasswordHash.mockResolvedValue({ id: 1 });

      await expect(service.verifyCurrentPassword(1, 'pass')).resolves.toBe(
        false,
      );
    });

    it('verifies the password and handles failures gracefully', async () => {
      users.findByIdWithPasswordHash.mockResolvedValue({
        id: 1,
        hash: 'stored',
      });
      (argon.verify as jest.Mock).mockResolvedValue(true);

      await expect(service.verifyCurrentPassword(1, 'ok')).resolves.toBe(true);

      (argon.verify as jest.Mock).mockRejectedValue(new Error('boom'));

      await expect(service.verifyCurrentPassword(1, 'ok')).resolves.toBe(false);
    });
  });
});
