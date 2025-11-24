import { CommentService } from './comment.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { AssetUrlService } from 'src/common/asset-url.service';

describe('CommentService', () => {
  let service: CommentService;
  let prisma: {
    comment: {
      findMany: jest.Mock;
      create: jest.Mock;
      count: jest.Mock;
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
        count: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    assetUrl = {
      thumbKeyToCdnUrl: jest.fn((key) => `cdn/${key}`),
    };

    prisma.$transaction.mockImplementation(async (calls: Array<Promise<any>>) =>
      Promise.all(calls),
    );

    service = new CommentService(
      prisma as unknown as PrismaService,
      assetUrl as unknown as AssetUrlService,
    );
  });

  it('fetches root comments including replies and authors', async () => {
    const rows = [{ id: 1 }, { id: 2 }];
    prisma.comment.findMany.mockResolvedValue(rows);

    await expect(service.getComments(10)).resolves.toBe(rows);
    expect(prisma.comment.findMany).toHaveBeenCalledWith({
      where: { galleryId: 10, parentId: null },
      include: {
        user: true,
        replies: {
          include: { user: true, replies: true },
        },
      },
    });
  });

  it('creates comments with the provided payload', async () => {
    const dto = { text: 'hi', userId: 1, galleryId: 2 };
    prisma.comment.create.mockResolvedValue({ id: 1, ...dto });

    await expect(service.createComment(dto as any)).resolves.toMatchObject(dto);
    expect(prisma.comment.create).toHaveBeenCalledWith({
      data: dto,
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
