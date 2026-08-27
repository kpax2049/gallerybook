import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AssetUrlService } from 'src/common/asset-url.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { FolderService } from './folder.service';

describe('FolderService', () => {
  let service: FolderService;
  let assetUrl: { thumbKeyToCdnUrl: jest.Mock };
  let prisma: {
    folder: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    gallery: {
      findUnique: jest.Mock;
      count: jest.Mock;
    };
  };

  beforeEach(() => {
    prisma = {
      folder: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      gallery: {
        findUnique: jest.fn(),
        count: jest.fn(),
      },
    };
    assetUrl = {
      thumbKeyToCdnUrl: jest.fn((key) => (key ? `cdn/${key}` : null)),
    };

    service = new FolderService(
      prisma as unknown as PrismaService,
      assetUrl as unknown as AssetUrlService,
    );
  });

  it('lists owner folders with gallery counts', async () => {
    const now = new Date();
    prisma.folder.findMany.mockResolvedValue([
      {
        id: 1,
        createdAt: now,
        updatedAt: now,
        name: 'Travel',
        slug: 'travel',
        description: 'Trips',
        color: '#14b8a6',
        coverGalleryId: 11,
        userId: 7,
        coverGallery: {
          id: 11,
          title: 'Cover',
          thumbnail: 'cover.jpg',
          slug: 'cover',
          folderId: 1,
        },
        _count: { galleries: 3 },
      },
    ]);

    await expect(service.listForUser(7)).resolves.toEqual([
      {
        id: 1,
        createdAt: now,
        updatedAt: now,
        name: 'Travel',
        slug: 'travel',
        description: 'Trips',
        color: '#14b8a6',
        coverGalleryId: 11,
        userId: 7,
        galleriesCount: 3,
        coverGallery: {
          id: 11,
          title: 'Cover',
          thumbnail: 'cdn/cover.jpg',
          slug: 'cover',
          folderId: 1,
        },
      },
    ]);
    expect(prisma.folder.findMany).toHaveBeenCalledWith({
      where: { userId: 7 },
      orderBy: [{ updatedAt: 'desc' }, { name: 'asc' }],
      include: {
        _count: { select: { galleries: true } },
        coverGallery: {
          select: {
            id: true,
            title: true,
            thumbnail: true,
            slug: true,
            folderId: true,
          },
        },
      },
    });
  });

  it('returns a public folder with published public and unlisted galleries', async () => {
    const now = new Date('2026-01-01T00:00:00.000Z');
    prisma.folder.findFirst.mockResolvedValue({
      id: 1,
      createdAt: now,
      updatedAt: now,
      name: 'Travel',
      slug: 'travel',
      description: 'Trips',
      color: '#14b8a6',
      coverGalleryId: 11,
      userId: 7,
      owner: {
        id: 7,
        fullName: 'Artist Name',
        username: 'artist',
        profile: { avatarUrl: 'avatar.jpg' },
      },
      coverGallery: {
        id: 11,
        title: 'Cover',
        thumbnail: 'cover.jpg',
        slug: 'cover',
        folderId: 1,
      },
      galleries: [
        {
          id: 11,
          userId: 7,
          title: 'Cover',
          description: 'First trip',
          content: null,
          thumbnail: 'cover.jpg',
          folderId: 1,
          status: 'PUBLISHED',
          visibility: 'UNLISTED',
          createdAt: now,
          updatedAt: now,
          slug: 'cover',
          viewsCount: 4,
          likesCount: 2,
          favoritesCount: 1,
          tags: [{ tag: { name: 'Travel', slug: 'travel' } }],
          _count: { comments: 3 },
          createdBy: {
            id: 7,
            fullName: 'Artist Name',
            username: 'artist',
            profile: { avatarUrl: 'avatar.jpg' },
          },
        },
      ],
    });

    prisma.gallery.count.mockResolvedValue(1);

    await expect(
      service.getPublicFolder('artist', 'travel', { page: 2, pageSize: 10 }),
    ).resolves.toEqual({
      folder: {
        id: 1,
        createdAt: now,
        updatedAt: now,
        name: 'Travel',
        slug: 'travel',
        description: 'Trips',
        color: '#14b8a6',
        coverGalleryId: 11,
        userId: 7,
        galleriesCount: 1,
        coverGallery: {
          id: 11,
          title: 'Cover',
          thumbnail: 'cdn/cover.jpg',
          slug: 'cover',
          folderId: 1,
        },
        owner: {
          id: 7,
          displayName: 'Artist Name',
          username: 'artist',
          avatarUrl: 'avatar.jpg',
        },
      },
      galleries: [
        {
          id: 11,
          userId: 7,
          title: 'Cover',
          description: 'First trip',
          content: null,
          thumbnail: 'cdn/cover.jpg',
          folderId: 1,
          status: 'PUBLISHED',
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          slug: 'cover',
          viewsCount: 4,
          likesCount: 2,
          favoritesCount: 1,
          visibility: 'UNLISTED',
          tags: ['travel'],
          author: {
            id: 7,
            displayName: 'Artist Name',
            username: 'artist',
            avatarUrl: 'avatar.jpg',
          },
        },
      ],
      commentCounts: { 11: 3 },
      total: 1,
      page: 2,
      pageSize: 10,
    });
    expect(prisma.folder.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          slug: 'travel',
          owner: { username: 'artist' },
        },
      }),
    );
    expect(
      prisma.folder.findFirst.mock.calls[0][0].include.galleries.where,
    ).toEqual({
      status: 'PUBLISHED',
      visibility: { in: ['PUBLIC', 'UNLISTED'] },
    });
    expect(prisma.folder.findFirst.mock.calls[0][0].include.galleries).toEqual(
      expect.objectContaining({
        orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
        skip: 10,
        take: 10,
      }),
    );
    expect(prisma.gallery.count).toHaveBeenCalledWith({
      where: {
        folderId: 1,
        status: 'PUBLISHED',
        visibility: { in: ['PUBLIC', 'UNLISTED'] },
      },
    });
  });

  it('throws not found for missing public folders', async () => {
    prisma.folder.findFirst.mockResolvedValue(null);

    await expect(
      service.getPublicFolder('artist', 'missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('creates folders with trimmed names and unique slugs', async () => {
    prisma.folder.findFirst
      .mockResolvedValueOnce({ id: 1 })
      .mockResolvedValueOnce(null);
    prisma.gallery.findUnique.mockResolvedValue({ userId: 7 });
    prisma.folder.create.mockResolvedValue({
      id: 2,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      name: 'Travel',
      slug: 'travel-2',
      description: 'Trips',
      color: '#14b8a6',
      coverGalleryId: 12,
      userId: 7,
      coverGallery: null,
      _count: { galleries: 0 },
    });

    await expect(
      service.create(7, {
        name: '  Travel  ',
        description: 'Trips',
        color: '#14b8a6',
        coverGalleryId: 12,
      }),
    ).resolves.toMatchObject({
      id: 2,
      slug: 'travel-2',
      coverGalleryId: 12,
      coverGallery: null,
      galleriesCount: 0,
    });

    expect(prisma.folder.findFirst).toHaveBeenNthCalledWith(1, {
      where: { userId: 7, slug: 'travel' },
      select: { id: true },
    });
    expect(prisma.folder.findFirst).toHaveBeenNthCalledWith(2, {
      where: { userId: 7, slug: 'travel-2' },
      select: { id: true },
    });
    expect(prisma.folder.create).toHaveBeenCalledWith({
      data: {
        userId: 7,
        name: 'Travel',
        slug: 'travel-2',
        description: 'Trips',
        color: '#14b8a6',
        coverGalleryId: 12,
      },
      include: {
        _count: { select: { galleries: true } },
        coverGallery: {
          select: {
            id: true,
            title: true,
            thumbnail: true,
            slug: true,
            folderId: true,
          },
        },
      },
    });
  });

  it('updates owned folders and clears optional fields', async () => {
    prisma.folder.findUnique.mockResolvedValue({
      id: 3,
      userId: 7,
      name: 'Old',
    });
    prisma.folder.findFirst.mockResolvedValue(null);
    prisma.folder.update.mockResolvedValue({
      id: 3,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      name: 'New',
      slug: 'new',
      description: null,
      color: null,
      coverGalleryId: null,
      userId: 7,
      coverGallery: null,
      _count: { galleries: 0 },
    });

    await expect(
      service.update(7, 3, {
        name: ' New ',
        description: undefined,
        color: undefined,
      }),
    ).resolves.toMatchObject({ id: 3, name: 'New' });

    expect(prisma.folder.update).toHaveBeenCalledWith({
      where: { id: 3 },
      data: { name: 'New', slug: 'new' },
      include: {
        _count: { select: { galleries: true } },
        coverGallery: {
          select: {
            id: true,
            title: true,
            thumbnail: true,
            slug: true,
            folderId: true,
          },
        },
      },
    });

    await service.update(7, 3, {
      description: null as any,
      color: null as any,
    });
    expect(prisma.folder.update).toHaveBeenLastCalledWith({
      where: { id: 3 },
      data: { description: null, color: null },
      include: {
        _count: { select: { galleries: true } },
        coverGallery: {
          select: {
            id: true,
            title: true,
            thumbnail: true,
            slug: true,
            folderId: true,
          },
        },
      },
    });
  });

  it('updates cover galleries only when they belong to the owner', async () => {
    prisma.folder.findUnique.mockResolvedValue({
      id: 3,
      userId: 7,
      name: 'Travel',
    });
    prisma.gallery.findUnique.mockResolvedValueOnce({ userId: 7 });
    prisma.folder.update.mockResolvedValue({
      id: 3,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      name: 'Travel',
      slug: 'travel',
      description: null,
      color: null,
      coverGalleryId: 12,
      userId: 7,
      coverGallery: {
        id: 12,
        title: 'Cover',
        thumbnail: 'cover.jpg',
        slug: 'cover',
        folderId: 3,
      },
      _count: { galleries: 2 },
    });

    await expect(service.update(7, 3, { coverGalleryId: 12 })).resolves.toEqual(
      expect.objectContaining({
        coverGalleryId: 12,
        coverGallery: expect.objectContaining({ thumbnail: 'cdn/cover.jpg' }),
      }),
    );
    expect(prisma.folder.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { coverGalleryId: 12 } }),
    );

    prisma.gallery.findUnique.mockResolvedValueOnce({ userId: 99 });
    await expect(
      service.update(7, 3, { coverGalleryId: 20 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deletes only owned folders', async () => {
    prisma.folder.findUnique.mockResolvedValue({ id: 4, userId: 7 });
    prisma.folder.delete.mockResolvedValue({ id: 4 });

    await expect(service.delete(7, 4)).resolves.toEqual({ ok: true });
    expect(prisma.folder.delete).toHaveBeenCalledWith({ where: { id: 4 } });
  });

  it('rejects missing or foreign folders', async () => {
    prisma.folder.findUnique.mockResolvedValueOnce(null);
    await expect(service.getOwnedFolder(7, 1)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    prisma.folder.findUnique.mockResolvedValueOnce({ id: 1, userId: 99 });
    await expect(service.getOwnedFolder(7, 1)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
