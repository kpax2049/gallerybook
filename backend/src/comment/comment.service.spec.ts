import { CommentService } from './comment.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { AssetUrlService } from 'src/common/asset-url.service';
import { ActionType } from '@prisma/client';

describe('CommentService', () => {
  let service: CommentService;
  let prisma: {
    comment: {
      findMany: jest.Mock;
      create: jest.Mock;
      findUnique: jest.Mock;
      count: jest.Mock;
    };
    actionCount: {
      findMany: jest.Mock;
      upsert: jest.Mock;
      update: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
    };
    reaction: {
      findUnique: jest.Mock;
      delete: jest.Mock;
      create: jest.Mock;
      findMany: jest.Mock;
    };
    user: {
      findUnique: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let assetUrl: { thumbKeyToCdnUrl: jest.Mock };

  beforeEach(() => {
    prisma = {
      comment: {
        findMany: jest.fn(),
        create: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
      },
      actionCount: {
        findMany: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      reaction: {
        findUnique: jest.fn(),
        delete: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    assetUrl = {
      thumbKeyToCdnUrl: jest.fn((key) => `cdn/${key}`),
    };

    prisma.$transaction.mockImplementation(async (arg: any) => {
      if (typeof arg === 'function') {
        return arg(prisma);
      }
      return Promise.all(arg);
    });

    service = new CommentService(
      prisma as unknown as PrismaService,
      assetUrl as unknown as AssetUrlService,
    );
  });

  it('fetches comments with action counts and selected actions merged', async () => {
    const rows = [
      {
        id: 1,
        user: {},
        replies: [{ id: 2, user: {}, replies: [] }],
      },
    ];
    prisma.comment.findMany.mockResolvedValue(rows);
    prisma.actionCount.findMany.mockResolvedValue([
      {
        commentId: 1,
        upvote: 2,
        rocket: 0,
        heart: 0,
        thumbUp: 1,
        thumbDown: 0,
        laugh: 0,
        hooray: 0,
        confused: 0,
        eye: 0,
      },
      {
        commentId: 2,
        upvote: 0,
        rocket: 0,
        heart: 0,
        thumbUp: 0,
        thumbDown: 0,
        laugh: 0,
        hooray: 0,
        confused: 0,
        eye: 0,
      },
    ]);
    prisma.reaction.findMany.mockResolvedValue([
      { commentId: 1, type: ActionType.UPVOTE },
    ]);

    const result = await service.getComments(10, 5);
    expect(prisma.comment.findMany).toHaveBeenCalledWith({
      where: { galleryId: 10, parentId: null },
      include: {
        user: true,
        replies: {
          include: { user: true, replies: true },
        },
      },
    });
    expect(result[0].actions[ActionType.UPVOTE]).toBe(2);
    expect(result[0].actions[ActionType.THUMB_UP]).toBe(1);
    expect(result[0].selectedActions).toEqual([ActionType.UPVOTE]);
    expect(result[0].replies[0].actions[ActionType.UPVOTE]).toBe(0);
  });

  it('creates comments with the provided payload', async () => {
    const dto = { text: 'hi', userId: 1, galleryId: 2 };
    prisma.comment.create.mockResolvedValue({ id: 1, ...dto });
    prisma.actionCount.create.mockResolvedValue({ commentId: 1 });

    await expect(service.createComment(dto as any)).resolves.toMatchObject(dto);
    expect(prisma.comment.create).toHaveBeenCalledWith({
      data: dto,
    });
    expect(prisma.actionCount.create).toHaveBeenCalledWith({
      data: { commentId: 1 },
    });
  });

  it('toggles reactions and returns latest counts and selection', async () => {
    prisma.comment.findUnique.mockResolvedValue({ id: 10 });
    prisma.actionCount.upsert.mockResolvedValue({ commentId: 10 });
    prisma.reaction.findUnique.mockResolvedValue(null);
    prisma.reaction.create.mockResolvedValue({ id: 1 });
    prisma.actionCount.update.mockResolvedValue({});
    prisma.actionCount.findUnique.mockResolvedValue({
      commentId: 10,
      upvote: 1,
      rocket: 0,
      heart: 0,
      thumbUp: 0,
      thumbDown: 0,
      laugh: 0,
      hooray: 0,
      confused: 0,
      eye: 0,
    });
    prisma.reaction.findMany.mockResolvedValue([
      { type: ActionType.UPVOTE, commentId: 10 },
    ]);

    const result = await service.toggleReaction(4, 10, ActionType.UPVOTE);

    expect(prisma.reaction.create).toHaveBeenCalledWith({
      data: { commentId: 10, userId: 4, type: ActionType.UPVOTE },
    });
    expect(prisma.actionCount.update).toHaveBeenCalledWith({
      where: { commentId: 10 },
      data: { upvote: { increment: 1 } },
    });
    expect(result).toEqual({
      active: true,
      actions: expect.objectContaining({ [ActionType.UPVOTE]: 1 }),
      selectedActions: [ActionType.UPVOTE],
    });

    // simulate untoggle
    prisma.reaction.findUnique.mockResolvedValue({ id: 1 });
    prisma.reaction.delete.mockResolvedValue({});
    prisma.actionCount.findUnique.mockResolvedValue({
      commentId: 10,
      upvote: 0,
      rocket: 0,
      heart: 0,
      thumbUp: 0,
      thumbDown: 0,
      laugh: 0,
      hooray: 0,
      confused: 0,
      eye: 0,
    });
    prisma.reaction.findMany.mockResolvedValue([]);

    const result2 = await service.toggleReaction(4, 10, ActionType.UPVOTE);
    expect(prisma.reaction.delete).toHaveBeenCalledWith({
      where: { commentId_userId_type: { commentId: 10, userId: 4, type: ActionType.UPVOTE } },
    });
    expect(prisma.actionCount.update).toHaveBeenCalledWith({
      where: { commentId: 10 },
      data: { upvote: { decrement: 1 } },
    });
    expect(result2).toEqual({
      active: false,
      actions: expect.objectContaining({ [ActionType.UPVOTE]: 0 }),
      selectedActions: [],
    });
  });

  it('lists comments scoped to my galleries with pagination and search', async () => {
    const now = new Date();
    const rows = [
      {
        id: 1,
        text: 'Nice shot',
        createdAt: now,
        user: {
          id: 2,
          username: 'artist',
          fullName: 'Artist',
          profile: { avatarUrl: 'avatar.png' },
        },
        gallery: {
          id: 3,
          title: 'Sunset',
          thumbnail: 'thumb.jpg',
        },
      },
    ];
    prisma.comment.count.mockResolvedValue(1);
    prisma.comment.findMany.mockResolvedValue(rows);

    const result = await service.list(42, {
      scope: 'onMyGalleries',
      search: 'sun',
      page: 2,
      pageSize: 24,
    });

    expect(prisma.comment.count).toHaveBeenCalledWith({
      where: {
        AND: [
          { gallery: { userId: 42 } },
          { text: { contains: 'sun', mode: 'insensitive' } },
        ],
      },
    });
    expect(prisma.comment.findMany).toHaveBeenCalledWith({
      where: {
        AND: [
          { gallery: { userId: 42 } },
          { text: { contains: 'sun', mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      skip: 24,
      take: 24,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            profile: { select: { avatarUrl: true } },
          },
        },
        gallery: {
          select: { id: true, title: true, thumbnail: true },
        },
      },
    });

    expect(assetUrl.thumbKeyToCdnUrl).toHaveBeenCalledWith('thumb.jpg');
    expect(result).toEqual({
      total: 1,
      page: 2,
      pageSize: 24,
      items: [
        {
          id: 1,
          body: 'Nice shot',
          createdAt: now,
          author: {
            id: 2,
            name: 'Artist',
            avatar: 'avatar.png',
          },
          gallery: {
            id: 3,
            title: 'Sunset',
            thumbnail: 'cdn/thumb.jpg',
          },
        },
      ],
    });
  });

  it('falls back to id -1 when mention scope has no username and clamps paging', async () => {
    prisma.user.findUnique.mockResolvedValue({ username: null });
    prisma.comment.count.mockResolvedValue(0);
    prisma.comment.findMany.mockResolvedValue([]);

    const result = await service.list(5, {
      scope: 'mentions',
      page: 0,
      pageSize: 200,
    });

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 5 },
      select: { username: true },
    });
    expect(prisma.comment.count).toHaveBeenCalledWith({
      where: { AND: [{ id: -1 }] },
    });
    expect(prisma.comment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 100,
      }),
    );
    expect(result).toEqual({ items: [], total: 0, page: 1, pageSize: 100 });
  });
});
