import { CommentService } from './comment.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { AssetUrlService } from 'src/common/asset-url.service';
import { ActionType, GalleryStatus, Role, Visibility } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';

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
      deleteMany: jest.Mock;
      createMany: jest.Mock;
      findMany: jest.Mock;
      groupBy: jest.Mock;
    };
    user: {
      findUnique: jest.Mock;
    };
    gallery: {
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
        deleteMany: jest.fn(),
        createMany: jest.fn(),
        findMany: jest.fn(),
        groupBy: jest.fn().mockResolvedValue([]),
      },
      user: {
        findUnique: jest.fn(),
      },
      gallery: {
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
    prisma.gallery.findUnique.mockResolvedValue({
      status: GalleryStatus.PUBLISHED,
      visibility: Visibility.PUBLIC,
    });
    const rows = [
      {
        id: 1,
        user: {},
        replies: [
          {
            id: 2,
            user: {},
            replies: [{ id: 3, user: {}, replies: [] }],
          },
        ],
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
      {
        commentId: 3,
        upvote: 0,
        rocket: 1,
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
      { commentId: 3, type: ActionType.ROCKET },
    ]);

    const result = await service.getComments(10, { id: 5, role: Role.USER });
    expect(prisma.comment.findMany).toHaveBeenCalledWith({
      where: {
        galleryId: 10,
        parentId: null,
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      include: {
        user: true,
        replies: {
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
          include: expect.objectContaining({
            user: true,
            replies: expect.objectContaining({
              orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
              include: expect.objectContaining({
                user: true,
                replies: expect.objectContaining({
                  orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
                }),
              }),
            }),
          }),
        },
      },
    });
    expect(result[0].actions[ActionType.UPVOTE]).toBe(2);
    expect(result[0].actions[ActionType.THUMB_UP]).toBe(1);
    expect(result[0].selectedActions).toEqual([ActionType.UPVOTE]);
    expect(result[0].replies[0].actions[ActionType.UPVOTE]).toBe(0);
    expect(result[0].replies[0].replies[0].actions[ActionType.ROCKET]).toBe(1);
    expect(result[0].replies[0].replies[0].selectedActions).toEqual([
      ActionType.ROCKET,
    ]);
  });

  it('does not constrain comment reads for admins', async () => {
    prisma.gallery.findUnique.mockResolvedValue({
      status: GalleryStatus.DRAFT,
      visibility: Visibility.PRIVATE,
    });
    prisma.comment.findMany.mockResolvedValue([]);

    await service.getComments(10, { id: 1, role: Role.ADMIN });

    expect(prisma.comment.findMany).toHaveBeenCalledWith({
      where: { galleryId: 10, parentId: null },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      include: {
        user: true,
        replies: {
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
          include: expect.objectContaining({
            user: true,
            replies: expect.any(Object),
          }),
        },
      },
    });
  });

  it('creates comments for readable galleries with server-owned user ids', async () => {
    const user = { id: 1, role: Role.USER };
    const dto = { text: 'hi', galleryId: 2 };
    prisma.gallery.findUnique.mockResolvedValue({
      status: GalleryStatus.PUBLISHED,
      visibility: Visibility.PUBLIC,
    });
    prisma.comment.create.mockResolvedValue({
      id: 1,
      ...dto,
      userId: user.id,
      user: { id: 1, username: 'artist', profile: { avatarUrl: 'avatar.png' } },
    });
    prisma.actionCount.create.mockResolvedValue({
      commentId: 1,
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

    await expect(service.createComment(user, dto)).resolves.toMatchObject({
      ...dto,
      userId: user.id,
      user: { id: 1, username: 'artist', profile: { avatarUrl: 'avatar.png' } },
      selectedActions: [],
      replies: [],
    });
    expect(prisma.comment.create).toHaveBeenCalledWith({
      data: { ...dto, userId: user.id },
      include: { user: { include: { profile: true } } },
    });
    expect(prisma.actionCount.create).toHaveBeenCalledWith({
      data: { commentId: 1 },
    });
  });

  it('rejects comment creation for inaccessible galleries', async () => {
    prisma.gallery.findUnique.mockResolvedValue({
      status: GalleryStatus.PUBLISHED,
      visibility: Visibility.PRIVATE,
    });

    await expect(
      service.createComment(
        { id: 1, role: Role.USER },
        { text: 'hidden', galleryId: 2 },
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.comment.create).not.toHaveBeenCalled();
  });

  it('rejects reply parents from another gallery', async () => {
    prisma.gallery.findUnique.mockResolvedValue({
      status: GalleryStatus.PUBLISHED,
      visibility: Visibility.PUBLIC,
    });
    prisma.comment.findUnique.mockResolvedValue({ galleryId: 99 });

    await expect(
      service.createComment(
        { id: 1, role: Role.USER },
        { text: 'wrong thread', galleryId: 2, parentId: 10 },
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.comment.create).not.toHaveBeenCalled();
  });

  it('hides inaccessible comment threads', async () => {
    prisma.gallery.findUnique.mockResolvedValue({
      status: GalleryStatus.DRAFT,
      visibility: Visibility.PUBLIC,
    });

    await expect(
      service.getComments(2, { id: 1, role: Role.USER }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.comment.findMany).not.toHaveBeenCalled();
  });

  it('toggles reactions and returns latest counts and selection', async () => {
    prisma.comment.findUnique.mockResolvedValue({
      id: 10,
      gallery: {
        status: GalleryStatus.PUBLISHED,
        visibility: Visibility.PUBLIC,
      },
    });
    prisma.actionCount.upsert.mockResolvedValue({ commentId: 10 });
    prisma.reaction.findUnique.mockResolvedValue(null);
    prisma.reaction.createMany.mockResolvedValue({ count: 1 });
    prisma.reaction.groupBy.mockResolvedValue([
      { type: ActionType.UPVOTE, _count: { _all: 1 } },
    ]);
    prisma.actionCount.update.mockResolvedValue({
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

    const user = { id: 4, role: Role.USER };
    const result = await service.toggleReaction(user, 10, ActionType.UPVOTE);

    expect(prisma.reaction.createMany).toHaveBeenCalledWith({
      data: [{ commentId: 10, userId: 4, type: ActionType.UPVOTE }],
      skipDuplicates: true,
    });
    expect(prisma.actionCount.update).toHaveBeenCalledWith({
      where: { commentId: 10 },
      data: {
        thumbUp: 0,
        thumbDown: 0,
        laugh: 0,
        hooray: 0,
        confused: 0,
        heart: 0,
        rocket: 0,
        eye: 0,
        upvote: 1,
      },
    });
    expect(result).toEqual({
      active: true,
      actions: expect.objectContaining({ [ActionType.UPVOTE]: 1 }),
      selectedActions: [ActionType.UPVOTE],
    });

    // simulate untoggle
    prisma.reaction.findUnique.mockResolvedValue({ id: 1 });
    prisma.reaction.deleteMany.mockResolvedValue({ count: 1 });
    prisma.reaction.groupBy.mockResolvedValue([]);
    prisma.actionCount.update.mockResolvedValue({
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

    const result2 = await service.toggleReaction(user, 10, ActionType.UPVOTE);
    expect(prisma.reaction.deleteMany).toHaveBeenCalledWith({
      where: { commentId: 10, userId: 4, type: ActionType.UPVOTE },
    });
    expect(prisma.actionCount.update).toHaveBeenCalledWith({
      where: { commentId: 10 },
      data: {
        thumbUp: 0,
        thumbDown: 0,
        laugh: 0,
        hooray: 0,
        confused: 0,
        heart: 0,
        rocket: 0,
        eye: 0,
        upvote: 0,
      },
    });
    expect(result2).toEqual({
      active: false,
      actions: expect.objectContaining({ [ActionType.UPVOTE]: 0 }),
      selectedActions: [],
    });
  });

  it('rejects reactions on comments from inaccessible galleries', async () => {
    prisma.comment.findUnique.mockResolvedValue({
      id: 10,
      gallery: {
        status: GalleryStatus.PUBLISHED,
        visibility: Visibility.PRIVATE,
      },
    });

    await expect(
      service.toggleReaction({ id: 4, role: Role.USER }, 10, ActionType.UPVOTE),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.reaction.findUnique).not.toHaveBeenCalled();
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
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
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
