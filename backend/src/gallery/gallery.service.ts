import {
  BadRequestException,
  // BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateGalleryDto } from './dto';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
// import { ProseMirrorDocSchema } from './zod/prosemirror.schema';
import { ConfigService } from '@nestjs/config';
import { GalleryStatus, Prisma, ReactionType, User } from '@prisma/client';
import { Role } from '@prisma/client';
import { extname } from 'path';
import { lookup as mimeLookup } from 'mime-types';
import { CreateDraftGalleryDto } from './dto/create-draft-gallery.dto';
import { extractS3KeysFromContent } from 'src/utils/gallery.utils';
import { UpdateGalleryDto } from './dto/update-gallery-dto';
import { ListGalleriesDto, SortDir, SortKey } from './dto/list-galleries.dto';
import { AssetUrlService } from 'src/common/asset-url.service';
import { slugify } from 'src/utils/slug.util';

type Mode = 'edit' | 'view';

const allowedMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
];

interface ProseMirrorNode {
  type: string;
  attrs?: Record<string, any>;
  content?: ProseMirrorNode[];
}

const SELECT_LIST = {
  tags: { include: { tag: true } },
  _count: { select: { comments: true } },
  // author fields for the card hover
  createdBy: {
    select: {
      id: true,
      fullName: true,
      username: true,
      profile: {
        select: { avatarUrl: true },
      },
    },
  },
} as const;

type ListRow = Prisma.GalleryGetPayload<{ include: typeof SELECT_LIST }>;

@Injectable()
export class GalleryService {
  private s3: S3Client;
  private readonly bucket: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private assetUrl: AssetUrlService,
  ) {
    this.bucket = this.config.get<string>(
      'S3_BUCKET_NAME',
      'gallerybook-images',
    );

    this.s3 = new S3Client({
      region: this.config.get<string>('AWS_REGION'),
      credentials: {
        accessKeyId: this.config.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.config.get<string>('AWS_SECRET_ACCESS_KEY'),
      },
    });
  }

  async generatePresignedUrls(
    paths: string[],
  ): Promise<Record<string, string>> {
    const result: Record<string, string> = {};

    try {
      await Promise.all(
        paths.map(async (path) => {
          const ext = extname(path); // e.g. ".webp"
          const mime = mimeLookup(ext) || '';
          const normalizedType = mime === 'image/jpg' ? 'image/jpeg' : mime;

          if (!allowedMimeTypes.includes(normalizedType)) {
            throw new BadRequestException(`Unsupported image type: ${mime}`);
          }
          const contentType = mimeLookup(ext) || 'application/octet-stream'; // fallback safe type

          const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: path,
            ContentType: contentType,
          });

          const url = await getSignedUrl(this.s3, command, { expiresIn: 300 });
          result[path] = url;
        }),
      );

      return result;
    } catch (error) {
      console.error('S3 presign error:', error);
      throw new InternalServerErrorException(
        'Could not generate presigned URLs',
      );
    }
  }

  async rewriteImageSrcsInNode(
    node: ProseMirrorNode,
    mode: Mode,
  ): Promise<ProseMirrorNode> {
    if (Array.isArray(node)) {
      for (const n of node) {
        this.rewriteImageSrcsInNode(n, mode);
      }
      return;
    }
    // console.log('Visiting node type:', node.type);
    // console.log('Node content:', node.content);
    const updatedNode: ProseMirrorNode = { ...node };

    // Rewrite image src
    if (node.type === 'image' && node.attrs?.src) {
      const originalSrc = node.attrs.src; // e.g., 'uploads/user1/photo.jpg'
      if (mode === 'view') {
        // Replace with CloudFront + transforms
        const cloudfrontDomain = this.config.get<string>('CLOUDFRONT_DOMAIN');
        const transformParams = this.config.get<string>(
          'LAMBDA_TRANSFORM_PARAMS',
        );
        updatedNode.attrs = {
          ...updatedNode.attrs,
          src: `${cloudfrontDomain}/${originalSrc}?${transformParams}`,
        };
      } else if (mode === 'edit') {
        // Replace with presigned S3 URL
        const command = new GetObjectCommand({
          Bucket: this.bucket,
          Key: originalSrc,
        });

        const signedUrl = await getSignedUrl(this.s3, command, {
          expiresIn: 300,
        }); // 5 minutes
        updatedNode.attrs = {
          ...updatedNode.attrs,
          src: signedUrl,
        };
      }
    }
    if (Array.isArray(node.content)) {
      for (const child of node.content) {
        this.rewriteImageSrcsInNode(child, mode);
      }
    }

    // Recursively process content
    if (node.content && Array.isArray(node.content)) {
      updatedNode.content = await Promise.all(
        node.content.map((child) => this.rewriteImageSrcsInNode(child, mode)),
      );
    }

    return updatedNode;
  }

  async rewriteGalleryImageSrcs(
    content: any,
    mode: Mode,
  ): Promise<ProseMirrorNode> {
    return await this.rewriteImageSrcsInNode(content, mode);
  }

  private thumbKeyToCdnUrl(key: string | null) {
    return this.assetUrl.thumbKeyToCdnUrl(key);
  }

  async checkGalleryOwnershipOrAdmin(
    galleryId: number,
    user: User,
  ): Promise<boolean> {
    // Admins can bypass ownership
    if (user.role === Role.ADMIN) return true;

    const gallery = await this.prisma.gallery.findUnique({
      where: { id: galleryId },
      select: { userId: true },
    });

    if (!gallery) return false;
    return gallery.userId === user.id;
  }

  async verifyOwnership(galleryId: number, userId: number) {
    const gallery = await this.prisma.gallery.findUnique({
      where: { id: galleryId },
    });

    if (!gallery) throw new NotFoundException();
    if (gallery.userId !== userId) throw new ForbiddenException();
  }

  async getGalleries(userId: number) {
    const galleries = await this.prisma.gallery.findMany({
      where: {
        userId,
      },
      select: {
        id: true,
        title: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        status: true,
        thumbnail: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    return galleries.map((g) => ({
      id: g.id,
      title: g.title,
      description: g.description,
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
      status: g.status,
      thumbnail: this.thumbKeyToCdnUrl(g.thumbnail),
    }));
  }

  async createDraft(dto: CreateDraftGalleryDto, userId: number) {
    const normalized = this.normalizeTags(dto.tags ?? []);
    const slug = await this.generateUniqueSlug(dto.title);

    return this.prisma.$transaction(async (tx) => {
      const gallery = await tx.gallery.create({
        data: {
          title: dto.title,
          description: dto.description,
          thumbnail: dto.thumbnail,
          slug,
          userId,
        },
      });

      if (normalized.length) {
        const tagIds = await this.upsertTagsAndGetIds(normalized); // returns number[]
        await tx.galleryTag.createMany({
          data: tagIds.map((tagId) => ({ galleryId: gallery.id, tagId })),
          skipDuplicates: true,
        });
      }

      return gallery;
    });
  }

  async updateContent(galleryId: number, content: any) {
    return this.prisma.gallery.update({
      where: { id: galleryId },
      data: {
        content,
        status: GalleryStatus.PUBLISHED,
        updatedAt: new Date(),
      },
    });
  }

  async createGallery(userId: number, dto: CreateGalleryDto) {
    const { tags: incomingTags, ...fields } = dto;
    const normalized = this.normalizeTags(incomingTags ?? []);

    const slug = await this.generateUniqueSlug(dto.title);
    const created = await this.prisma.gallery.create({
      data: {
        userId,
        slug,
        ...fields,
        ...(normalized.length > 0 && {
          // "tags" is your explicit join relation (GalleryTag[])
          tags: {
            create: normalized.map((name) => ({
              tag: {
                connectOrCreate: {
                  where: { slug: this.slugify(name) }, // ensure unique index on Tag.slug
                  create: { name, slug: this.slugify(name) },
                },
              },
            })),
          },
        }),
      },
      include: {
        tags: { include: { tag: { select: { name: true, slug: true } } } },
      },
    });

    // Flatten join rows -> string[]
    const tagList = created.tags.map((row) => row.tag.slug ?? row.tag.name);

    // Overwrite relation with the string[] in the response
    return { ...created, tags: tagList };
  }

  async getGalleryById(galleryId: number, mode: 'view' | 'edit') {
    const gallery = await this.prisma.gallery.findUnique({
      where: {
        id: galleryId,
      },
      include: {
        tags: {
          include: { tag: { select: { slug: true, name: true } } },
          orderBy: { tag: { name: 'asc' } }, // optional: stable order
        },
      },
    });
    if (!gallery) {
      throw new Error('Gallery not found');
    }
    const tagList = gallery.tags.map((row) => row.tag.slug ?? row.tag.name);
    const rewritten = await this.rewriteGalleryImageSrcs(
      gallery.content,
      mode === 'view' ? 'view' : 'edit',
    );
    return { ...gallery, content: rewritten, tags: tagList };
    // if (mode === 'view') {
    //   // const cacheKey = this.getCacheKey(galleryId);
    //   // const cached = await this.cacheManager.get(cacheKey);
    //   // if (cached) {
    //   //   return { ...gallery, content: cached };
    //   // }

    //   // Rewrite URLs to CloudFront + transforms for viewing
    //   const rewritten = await this.rewriteGalleryImageSrcs(
    //     gallery.content,
    //     'view',
    //   );

    //   // // Cache rewritten JSON for 1 hour
    //   // await this.cacheManager.set(cacheKey, rewritten, { ttl: 3600 });
    //   return { ...gallery, content: rewritten };
    // } else {
    //   // Edit mode — always fresh, presigned S3 URLs
    //   const rewritten = await this.rewriteGalleryImageSrcs(
    //     gallery.content,
    //     'edit',
    //   );
    //   return { ...gallery, content: rewritten };
    // }
  }

  async editGalleryById(
    userId: number,
    galleryId: number,
    dto: UpdateGalleryDto,
  ) {
    // fetch & authorize
    const existing = await this.prisma.gallery.findUnique({
      where: { id: galleryId },
    });
    if (!existing || existing.userId !== userId) {
      throw new ForbiddenException('Access to Resource Denied');
    }

    // split fields
    const { tags: incomingTags, title: incomingTitle, ...rest } = dto;

    return this.prisma.$transaction(async (tx) => {
      // If caller sent a (non-empty) title, normalize it and derive a unique slug from it.
      const titleToSet =
        typeof incomingTitle === 'string' && incomingTitle.trim()
          ? incomingTitle.trim()
          : undefined;

      const slugToSet = titleToSet
        ? await this.generateUniqueSlug(titleToSet, galleryId)
        : undefined;

      // 1) update fields + optional title/slug
      await tx.gallery.update({
        where: { id: galleryId },
        data: {
          ...rest,
          ...(titleToSet ? { title: titleToSet } : {}),
          ...(slugToSet ? { slug: slugToSet } : {}),
        },
      });

      // 2) if tags were provided, fully replace them
      if (incomingTags !== undefined) {
        const normalized = this.normalizeTags(incomingTags ?? []);

        // clear existing links
        await tx.galleryTag.deleteMany({ where: { galleryId } });

        if (normalized.length) {
          // upsert/fetch tag IDs
          const tagRows = await Promise.all(
            normalized.map((name) =>
              tx.tag.upsert({
                where: { slug: this.slugify(name) }, // ensure unique index on Tag.slug
                update: {},
                create: { name, slug: this.slugify(name) },
                select: { id: true },
              }),
            ),
          );
          const tagIds = tagRows.map((r) => r.id);

          // recreate links
          await tx.galleryTag.createMany({
            data: tagIds.map((tagId) => ({ galleryId, tagId })),
            skipDuplicates: true,
          });
        }
      }

      // 3) return payload with tags as string[]
      const withTags = await tx.gallery.findUnique({
        where: { id: galleryId },
        include: {
          tags: {
            include: { tag: { select: { name: true, slug: true } } },
            orderBy: { tag: { name: 'asc' } },
          },
        },
      });
      if (!withTags)
        throw new NotFoundException('Gallery not found after update');

      const tagList = withTags.tags.map((row) => row.tag.slug ?? row.tag.name);
      return { ...withTags, tags: tagList }; // overwrites relation object with string[]
    });
  }

  async deleteGalleryById(userId: number, galleryId: number) {
    // get gallery by id
    const gallery = await this.prisma.gallery.findUnique({
      where: {
        id: galleryId,
      },
    });
    // check if user owns gallery
    if (!gallery || gallery.userId !== userId) {
      throw new ForbiddenException('Access to Resource Denied');
    }

    const content = gallery.content as any;
    const keys = extractS3KeysFromContent(content); // Returns relative S3 paths

    await this.deleteImagesFromS3(keys);

    await this.prisma.gallery.delete({
      where: {
        id: galleryId,
      },
    });
  }

  async findById(galleryId: number) {
    const gallery = await this.prisma.gallery.findUnique({
      where: { id: galleryId },
    });

    if (!gallery) {
      throw new NotFoundException(`Gallery with ID ${galleryId} not found`);
    }

    return gallery;
  }

  async deleteImagesFromS3(keys: string[]): Promise<void> {
    const objects = keys.map((Key) => ({ Key }));
    const command = new DeleteObjectsCommand({
      Bucket: this.bucket,
      Delete: { Objects: objects, Quiet: true },
    });

    try {
      await this.s3.send(command);
    } catch (err) {
      console.log('Failed to delete images from S3', err);
      throw new InternalServerErrorException('Failed to delete images');
    }
  }

  async list(userId: number | null, dto: ListGalleriesDto) {
    let favoriteIds: number[] | undefined;
    let likedIds: number[] | undefined;

    if (dto.favoriteBy !== undefined) {
      const favUserId = this.coerceFavUserId(dto.favoriteBy, userId);
      if (favUserId === undefined) {
        return {
          total: 0,
          page: dto.page ?? 1,
          pageSize: dto.pageSize ?? 24,
          items: [],
          commentCounts: {},
          myReactions: {},
        };
      }

      const favRows = await this.prisma.galleryReaction.findMany({
        where: { userId: favUserId, type: ReactionType.FAVORITE },
        select: { galleryId: true },
      });
      favoriteIds = favRows.map((r) => r.galleryId);

      if (!favoriteIds.length) {
        return {
          total: 0,
          page: dto.page ?? 1,
          pageSize: dto.pageSize ?? 24,
          items: [],
          commentCounts: {},
          myReactions: {},
        };
      }
    }

    if (dto.likedBy !== undefined) {
      const likedUserId = this.coerceFavUserId(dto.likedBy, userId);
      if (likedUserId === undefined) {
        return {
          total: 0,
          page: dto.page ?? 1,
          pageSize: dto.pageSize ?? 24,
          items: [],
          commentCounts: {},
          myReactions: {},
        };
      }

      const likeRows = await this.prisma.galleryReaction.findMany({
        where: { userId: likedUserId, type: ReactionType.LIKE },
        select: { galleryId: true },
      });
      likedIds = likeRows.map((r) => r.galleryId);

      if (!likedIds.length) {
        return {
          total: 0,
          page: dto.page ?? 1,
          pageSize: dto.pageSize ?? 24,
          items: [],
          commentCounts: {},
          myReactions: {},
        };
      }
    }

    const where = this.buildWhere(userId, dto, favoriteIds, likedIds);
    const orderBy = this.buildOrderBy(
      dto.sortKey ?? 'updatedAt',
      dto.sortDir ?? 'desc',
    );
    const { skip, take, page, pageSize } = this.getPagination(
      dto.page,
      dto.pageSize,
    );

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.gallery.count({ where }),
      this.prisma.gallery.findMany({
        where,
        orderBy,
        skip,
        take,
        include: SELECT_LIST,
      }),
    ]);

    const items = rows.map((row) => {
      const g = this.mapToListItem(row);
      // convert S3 keys to Cloudfront URLs for thumbnails
      return { ...g, thumbnail: this.thumbKeyToCdnUrl(g.thumbnail) };
    });
    const commentCounts = this.buildCommentCounts(rows);

    const myReactions =
      dto.includeMyReactions && userId
        ? await this.fetchMyReactionsMap(
            userId,
            rows.map((r) => r.id),
          )
        : undefined;

    return { total, page, pageSize, items, commentCounts, myReactions };
  }

  async toggleReaction(userId: number, galleryId: number, type: ReactionType) {
    await this.ensureGallery(galleryId);

    const key = { userId_galleryId_type: { userId, galleryId, type } };
    const existing = await this.prisma.galleryReaction.findUnique({
      where: key,
    });

    if (existing) {
      await this.prisma.$transaction([
        this.prisma.galleryReaction.delete({ where: key }),
        this.prisma.gallery.update({
          where: { id: galleryId },
          data:
            type === 'LIKE'
              ? { likesCount: { decrement: 1 } }
              : { favoritesCount: { decrement: 1 } },
        }),
      ]);
      return { active: false };
    }

    await this.prisma.$transaction([
      this.prisma.galleryReaction.create({ data: { userId, galleryId, type } }),
      this.prisma.gallery.update({
        where: { id: galleryId },
        data:
          type === 'LIKE'
            ? { likesCount: { increment: 1 } }
            : { favoritesCount: { increment: 1 } },
      }),
    ]);
    return { active: true };
  }

  async getMyReactions(userId: number, galleryId: number) {
    const reacts = await this.prisma.galleryReaction.findMany({
      where: { userId, galleryId },
      select: { type: true },
    });
    return {
      like: reacts.some((r) => r.type === 'LIKE'),
      favorite: reacts.some((r) => r.type === 'FAVORITE'),
    };
  }

  async replaceTags(userId: number, galleryId: number, tags?: string[]) {
    const gal = await this.prisma.gallery.findUnique({
      where: { id: galleryId },
    });
    if (!gal) throw new NotFoundException('Gallery not found');
    // if (gal.userId !== userId) throw new ForbiddenException();

    const normalized = this.normalizeTags(tags ?? []);

    // Create / fetch tag IDs for the normalized list
    const wantedIds = normalized.length
      ? new Set(await this.upsertTagsAndGetIds(normalized))
      : new Set<number>();

    // 🔁 Replace links atomically — delete all, then create the wanted ones
    await this.prisma.$transaction([
      this.prisma.galleryTag.deleteMany({ where: { galleryId } }),
      ...(wantedIds.size
        ? [
            this.prisma.galleryTag.createMany({
              data: [...wantedIds].map((tagId) => ({ galleryId, tagId })),
              skipDuplicates: true,
            }),
          ]
        : []),
    ]);

    // Return canonical tags
    if (wantedIds.size === 0) return { tags: [] };

    const final = await this.prisma.tag.findMany({
      where: { id: { in: [...wantedIds] } },
      select: { name: true, slug: true },
    });

    // Keep your existing preference for slug-or-name
    return { tags: final.map((t) => t.slug || t.name) };
  }

  async getGalleryBySlug(slug: string, mode: 'view' | 'edit') {
    const gallery = await this.prisma.gallery.findUnique({ where: { slug } });
    if (!gallery) throw new NotFoundException('Gallery not found');
    const content = await this.rewriteGalleryImageSrcs(gallery.content, mode);
    return { ...gallery, content };
  }

  // Helper functions
  private coerceFavUserId(favoriteBy: string | undefined, meId: number | null) {
    if (favoriteBy === undefined) return undefined;
    if (favoriteBy === 'me') return meId ?? undefined;
    const n = Number(favoriteBy);
    return Number.isFinite(n) ? n : undefined;
  }

  private buildWhere(
    userId: number | null,
    dto: ListGalleriesDto,
    favoriteIds?: number[],
    likedIds?: number[],
  ): Prisma.GalleryWhereInput {
    const AND: Prisma.GalleryWhereInput[] = [];
    const OR: Prisma.GalleryWhereInput[] = [];

    // If we're building the "followed feed", ignore owner/favorite filters for MVP
    const ignoreOwner = !!dto.followedOnly;
    const ignoreFavorite = !!dto.followedOnly;
    const ignoreLiked = !!dto.followedOnly;

    // status
    if (dto.status?.length) AND.push({ status: { in: dto.status as any } });

    // owner
    if (!ignoreOwner && (dto.owner ?? 'any') === 'me' && userId) {
      AND.push({ userId });
    }

    // favorites filter
    if (!ignoreFavorite && favoriteIds) {
      AND.push({ id: { in: favoriteIds } });
    }

    if (!ignoreLiked && likedIds) {
      AND.push({ id: { in: likedIds } });
    }

    // followed-only filter
    if (dto.followedOnly) {
      if (!userId) {
        // unauthenticated followed feed returns empty set
        AND.push({ id: -1 });
      } else {
        AND.push({
          createdBy: {
            // creator is someone I (viewer) follow
            followers: { some: { followerId: userId } },
          },
        });
      }
    }

    // updated range
    const since = this.sinceFromRange(dto.range ?? 'any');
    if (since) AND.push({ updatedAt: { gte: since } });

    // cover
    if (dto.hasCover !== null && typeof dto.hasCover !== 'undefined') {
      AND.push(
        dto.hasCover ? { thumbnail: { not: null } } : { thumbnail: null },
      );
    }

    // tags presence
    if (dto.hasTags !== null && typeof dto.hasTags !== 'undefined') {
      AND.push(dto.hasTags ? { tags: { some: {} } } : { tags: { none: {} } });
    }

    // comments presence
    if (dto.hasComments !== null && typeof dto.hasComments !== 'undefined') {
      AND.push(
        dto.hasComments
          ? { comments: { some: {} } }
          : { comments: { none: {} } },
      );
    }

    // tag filter (by slug OR name)
    if (dto.tags?.length) {
      AND.push({
        tags: {
          some: {
            tag: {
              OR: [{ slug: { in: dto.tags } }, { name: { in: dto.tags } }],
            },
          },
        },
      });
    }

    // search
    if (dto.search?.trim()) {
      const q = dto.search.trim();
      OR.push({ title: { contains: q, mode: 'insensitive' } });
      OR.push({ description: { contains: q, mode: 'insensitive' } });
    }

    // author filter (single)
    if (dto.createdById) AND.push({ userId: dto.createdById });

    const where: Prisma.GalleryWhereInput = {};
    if (AND.length) where.AND = AND;
    if (OR.length) where.OR = OR;
    return where;
  }

  private buildOrderBy(
    key: SortKey,
    dir: SortDir,
  ): Prisma.GalleryOrderByWithRelationInput[] {
    const d = dir ?? 'desc';
    switch (key) {
      case 'title':
        return [{ title: d }, { updatedAt: 'desc' }];
      case 'createdAt':
        return [{ createdAt: d }];
      case 'views':
        return [{ viewsCount: d as any }, { updatedAt: 'desc' }];
      case 'likes':
        return [{ likesCount: d as any }, { updatedAt: 'desc' }];
      case 'comments':
        // Prisma supports relation count ordering; cast keeps TS happy
        return [{ comments: { _count: d } } as any, { updatedAt: 'desc' }];
      case 'updatedAt':
      default:
        return [{ updatedAt: d }];
    }
  }

  private getPagination(page = 1, pageSize = 24) {
    const p = Math.max(1, page);
    const ps = Math.max(1, pageSize);
    return { page: p, pageSize: ps, skip: (p - 1) * ps, take: ps };
  }

  private mapToListItem(g: ListRow) {
    return {
      id: g.id,
      userId: g.userId,
      title: g.title,
      description: g.description,
      content: g.content as unknown,
      thumbnail: g.thumbnail,
      status: g.status,
      createdAt: g.createdAt.toISOString(),
      updatedAt: g.updatedAt.toISOString(),
      slug: g.slug ?? null,
      viewsCount: g.viewsCount ?? 0,
      likesCount: g.likesCount ?? 0,
      favoritesCount: g.favoritesCount ?? 0,
      tags: (g.tags ?? []).map((gt) => gt.tag.slug || gt.tag.name),
      author: {
        id: g.createdBy.id,
        displayName: g.createdBy.fullName ?? null,
        username: g.createdBy.username ?? null,
        avatarUrl: g.createdBy.profile?.avatarUrl ?? null,
      },
    };
  }

  private buildCommentCounts(rows: ListRow[]) {
    return Object.fromEntries(rows.map((g) => [g.id, g._count.comments]));
  }

  private async fetchMyReactionsMap(userId: number, galleryIds: number[]) {
    if (!galleryIds.length) return {};
    const uid = Number(userId);
    const reacts = await this.prisma.galleryReaction.findMany({
      where: { userId: uid, galleryId: { in: galleryIds } },
      select: { galleryId: true, type: true },
    });
    const map: Record<number, { like: boolean; favorite: boolean }> = {};
    for (const r of reacts) {
      const cur = (map[r.galleryId] ||= { like: false, favorite: false });
      if (r.type === 'LIKE') cur.like = true;
      if (r.type === 'FAVORITE') cur.favorite = true;
    }
    return map;
  }

  private sinceFromRange(range: ListGalleriesDto['range']) {
    switch (range) {
      case '7d':
        return new Date(Date.now() - 7 * 86400_000);
      case '30d':
        return new Date(Date.now() - 30 * 86400_000);
      case '90d':
        return new Date(Date.now() - 90 * 86400_000);
      default:
        return undefined;
    }
  }

  private async ensureGallery(id: number) {
    const exists = await this.prisma.gallery.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Gallery not found');
  }

  private slugify(s: string) {
    return s.trim().toLowerCase().replace(/\s+/g, '-'); // adjust to your rules
  }

  private normalizeTags(list: string[]) {
    // trim, collapse whitespace, dedupe case-insensitive
    const map = new Map<string, string>();
    for (const raw of list) {
      const t = raw.trim().replace(/\s+/g, ' ');
      if (!t) continue;
      const key = t.toLowerCase();
      if (!map.has(key)) map.set(key, t);
    }
    return [...map.values()];
  }

  private async upsertTagsAndGetIds(names: string[]): Promise<number[]> {
    const rows = await Promise.all(
      names.map((name) =>
        this.prisma.tag.upsert({
          where: { slug: this.slugify(name) }, // unique index on slug
          update: {},
          create: { name, slug: this.slugify(name) },
          select: { id: true },
        }),
      ),
    );
    return rows.map((r) => r.id);
  }

  private async generateUniqueSlug(title: string, excludeId?: number) {
    const base = slugify(title);
    let slug = base;
    let n = 2;
    // ensure uniqueness; exclude current row when updating
    // (you can also do this in a single query with a LIKE search if preferred)
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const existing = await this.prisma.gallery.findFirst({
        where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) },
        select: { id: true },
      });
      if (!existing) return slug;
      slug = `${base}-${n++}`;
    }
  }
}
