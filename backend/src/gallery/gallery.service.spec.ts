import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GalleryStatus, Role } from '@prisma/client';
import { AssetUrlService } from 'src/common/asset-url.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { GalleryService } from './gallery.service';
import { ListGalleriesDto } from './dto/list-galleries.dto';

describe('GalleryService', () => {
  let service: GalleryService;
  let prisma: {
    gallery: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
    };
    galleryReaction: {
      findMany: jest.Mock;
    };
  };
  let config: { get: jest.Mock };
  let assetUrl: { thumbKeyToCdnUrl: jest.Mock };

  beforeEach(() => {
    prisma = {
      gallery: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      galleryReaction: {
        findMany: jest.fn(),
      },
    };

    config = {
      get: jest.fn((key: string, fallback?: any) => {
        const values: Record<string, string> = {
          S3_BUCKET_NAME: 'bucket',
          AWS_REGION: 'us-east-1',
          AWS_ACCESS_KEY_ID: 'key',
          AWS_SECRET_ACCESS_KEY: 'secret',
          CLOUDFRONT_DOMAIN: 'https://cdn.example.com',
          LAMBDA_TRANSFORM_PARAMS: 'w=100',
        };
        return values[key] ?? fallback;
      }),
    };

    assetUrl = {
      thumbKeyToCdnUrl: jest.fn((key) => (key ? `cdn/${key}` : null)),
    };

    service = new GalleryService(
      prisma as unknown as PrismaService,
      config as unknown as ConfigService,
      assetUrl as unknown as AssetUrlService,
    );
  });

  describe('ownership helpers', () => {
    it('allows admins to bypass ownership checks', async () => {
      const user = { id: 1, role: Role.ADMIN } as any;
      await expect(service.checkGalleryOwnershipOrAdmin(5, user)).resolves.toBe(
        true,
      );
      expect(prisma.gallery.findUnique).not.toHaveBeenCalled();
    });

    it('returns true when the gallery belongs to the user', async () => {
      prisma.gallery.findUnique.mockResolvedValue({ userId: 1 });
      const user = { id: 1, role: Role.USER } as any;

      await expect(service.checkGalleryOwnershipOrAdmin(10, user)).resolves.toBe(
        true,
      );
      expect(prisma.gallery.findUnique).toHaveBeenCalledWith({
        where: { id: 10 },
        select: { userId: true },
      });
    });

    it('returns false when gallery missing or owned by another user', async () => {
      prisma.gallery.findUnique.mockResolvedValueOnce(null);
      const user = { id: 1, role: Role.USER } as any;
      await expect(service.checkGalleryOwnershipOrAdmin(1, user)).resolves.toBe(
        false,
      );

      prisma.gallery.findUnique.mockResolvedValueOnce({ userId: 99 });
      await expect(service.checkGalleryOwnershipOrAdmin(1, user)).resolves.toBe(
        false,
      );
    });

    it('verifyOwnership throws for missing or unauthorized galleries', async () => {
      prisma.gallery.findUnique.mockResolvedValueOnce(null);
      await expect(service.verifyOwnership(1, 1)).rejects.toBeInstanceOf(
        NotFoundException,
      );

      prisma.gallery.findUnique.mockResolvedValueOnce({ id: 2, userId: 2 });
      await expect(service.verifyOwnership(1, 1)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });

  it('maps thumbnails through AssetUrlService when listing my galleries', async () => {
    const now = new Date();
    prisma.gallery.findMany.mockResolvedValue([
      {
        id: 1,
        title: 'Test',
        description: 'desc',
        createdAt: now,
        updatedAt: now,
        status: GalleryStatus.PUBLISHED,
        thumbnail: 'thumb.jpg',
      },
    ]);

    const result = await service.getGalleries(5);

    expect(prisma.gallery.findMany).toHaveBeenCalledWith({
      where: { userId: 5 },
      select: expect.any(Object),
      orderBy: { updatedAt: 'desc' },
    });
    expect(assetUrl.thumbKeyToCdnUrl).toHaveBeenCalledWith('thumb.jpg');
    expect(result).toEqual([
      {
        id: 1,
        title: 'Test',
        description: 'desc',
        createdAt: now,
        updatedAt: now,
        status: GalleryStatus.PUBLISHED,
        thumbnail: 'cdn/thumb.jpg',
      },
    ]);
  });

  describe('buildWhere', () => {
    const buildWhere = (
      userId: number | null,
      dto: Partial<ListGalleriesDto>,
      favoriteIds?: number[],
      likedIds?: number[],
    ) => (service as any).buildWhere(userId, dto, favoriteIds, likedIds);

    it('includes owner + favorites + likes + tag + search filters', () => {
      const where = buildWhere(
        7,
        {
          owner: 'me',
          favoriteBy: 'me',
          likedBy: 'me',
          status: [GalleryStatus.PUBLISHED],
          tags: ['nature'],
          search: 'sun',
        },
        [1, 2],
        [2, 3],
      );

      expect(where.AND).toEqual(
        expect.arrayContaining([
          { userId: 7 },
          { status: { in: [GalleryStatus.PUBLISHED] } },
          { id: { in: [1, 2] } },
          { id: { in: [2, 3] } }, // intersection will be handled by Prisma
          {
            tags: {
              some: {
                tag: {
                  OR: [
                    { slug: { in: ['nature'] } },
                    { name: { in: ['nature'] } },
                  ],
                },
              },
            },
          },
        ]),
      );
      expect(where.OR).toEqual(
        expect.arrayContaining([
          { title: { contains: 'sun', mode: 'insensitive' } },
          { description: { contains: 'sun', mode: 'insensitive' } },
        ]),
      );
    });

    it('forces empty sets when followed filters cannot be satisfied', () => {
      const where = buildWhere(null, {
        followedOnly: true,
        range: '7d',
        hasCover: true,
        hasTags: false,
        hasComments: true,
        createdById: 9,
      });

      const idFilters = (where.AND ?? []).filter(
        (clause: any) => clause.id === -1,
      );
      expect(idFilters).toHaveLength(1);
      expect(where.AND).toEqual(
        expect.arrayContaining([
          { updatedAt: { gte: expect.any(Date) } },
          { thumbnail: { not: null } },
          { tags: { none: {} } },
          { comments: { some: {} } },
          { userId: 9 },
        ]),
      );
    });
  });

  describe('list favorites/likes', () => {
    it('returns empty favorite set early when user is missing', async () => {
      const res = await (service as any).list(null, {
        favoriteBy: 'me',
        page: 1,
        pageSize: 24,
      });
      expect(res.total).toBe(0);
      expect(res.items).toEqual([]);
    });

    it('returns empty liked set early when user is missing', async () => {
      const res = await (service as any).list(null, {
        likedBy: 'me',
        page: 1,
        pageSize: 24,
      });
      expect(res.total).toBe(0);
      expect(res.items).toEqual([]);
    });
  });

  it('normalizes tags by trimming, collapsing whitespace, and de-duping', () => {
    const normalize = (service as any).normalizeTags.bind(service);
    expect(
      normalize(['  Tag ', 'tag', 'Another   Tag', '', 'ANOTHER tag']),
    ).toEqual(['Tag', 'Another Tag']);
  });
});
