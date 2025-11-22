import { BadRequestException } from '@nestjs/common';
import { FollowService } from './follow.service';
import { PrismaService } from 'src/prisma/prisma.service';

type MockedPrisma = {
  follow: {
    create: jest.Mock;
    delete: jest.Mock;
    findMany: jest.Mock;
  };
  user: {
    findMany: jest.Mock;
  };
};

describe('FollowService', () => {
  let service: FollowService;
  let prisma: MockedPrisma;

  beforeEach(() => {
    prisma = {
      follow: {
        create: jest.fn(),
        delete: jest.fn(),
        findMany: jest.fn(),
      },
      user: {
        findMany: jest.fn(),
      },
    };

    service = new FollowService(prisma as unknown as PrismaService);
  });

  describe('follow', () => {
    it('prevents a user from following themselves', async () => {
      await expect(service.follow(1, 1)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.follow.create).not.toHaveBeenCalled();
    });

    it('creates the follow record when valid', async () => {
      prisma.follow.create.mockResolvedValue({ id: 1 });

      await expect(service.follow(1, 2)).resolves.toEqual({ ok: true });
      expect(prisma.follow.create).toHaveBeenCalledWith({
        data: { followerId: 1, followingId: 2 },
      });
    });

    it('swallows the P2002 unique constraint error (already following)', async () => {
      prisma.follow.create.mockRejectedValue({ code: 'P2002' });

      await expect(service.follow(1, 2)).resolves.toEqual({ ok: true });
    });

    it('rethrows unknown errors from prisma', async () => {
      const error = new Error('boom');
      prisma.follow.create.mockRejectedValue(error);

      await expect(service.follow(1, 2)).rejects.toBe(error);
    });
  });

  describe('unfollow', () => {
    it('deletes the relation and succeeds even if delete fails', async () => {
      prisma.follow.delete.mockResolvedValue({});
      await expect(service.unfollow(1, 2)).resolves.toEqual({ ok: true });
      expect(prisma.follow.delete).toHaveBeenCalledWith({
        where: {
          followerId_followingId: { followerId: 1, followingId: 2 },
        },
      });

      prisma.follow.delete.mockRejectedValue(new Error('not found'));
      await expect(service.unfollow(1, 2)).resolves.toEqual({ ok: true });
    });
  });

  describe('listFollowing', () => {
    it('short-circuits when the user follows nobody', async () => {
      prisma.follow.findMany.mockResolvedValue([]);

      await expect(service.listFollowing(1)).resolves.toEqual([]);
      expect(prisma.user.findMany).not.toHaveBeenCalled();
    });

    it('maps prisma results into the DTO shape and applies filters', async () => {
      prisma.follow.findMany.mockResolvedValue([
        { followingId: 2 },
        { followingId: 3 },
      ]);
      prisma.user.findMany.mockResolvedValue([
        {
          id: 2,
          fullName: 'Jane Doe',
          email: 'jane@example.com',
          profile: { avatarUrl: 'avatar.png' },
        },
        {
          id: 3,
          fullName: 'John Smith',
          email: 'john@example.com',
          profile: null,
        },
      ]);

      await expect(service.listFollowing(1, 'Jo', 5, 10)).resolves.toEqual([
        {
          id: 2,
          fullName: 'Jane Doe',
          email: 'jane@example.com',
          avatarUrl: 'avatar.png',
        },
        {
          id: 3,
          fullName: 'John Smith',
          email: 'john@example.com',
          avatarUrl: null,
        },
      ]);

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: [2, 3] },
          OR: [
            { fullName: { contains: 'Jo', mode: 'insensitive' } },
            { email: { contains: 'Jo', mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          profile: { select: { avatarUrl: true } },
        },
        orderBy: { fullName: 'asc' },
        skip: 5,
        take: 10,
      });
    });
  });

  describe('followingIds', () => {
    it('returns a flat array of following IDs', async () => {
      prisma.follow.findMany.mockResolvedValue([
        { followingId: 10 },
        { followingId: 20 },
      ]);

      await expect(service.followingIds(1)).resolves.toEqual([10, 20]);
    });
  });
});
