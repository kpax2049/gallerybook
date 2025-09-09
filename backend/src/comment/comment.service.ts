import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ListCommentsDto } from './dto/list-comments.dto';
import { Prisma } from '@prisma/client';
import { AssetUrlService } from 'src/common/asset-url.service';

@Injectable()
export class CommentService {
  constructor(
    private prisma: PrismaService,
    private assetUrl: AssetUrlService,
  ) {}

  getComments(galleryId: number) {
    return this.prisma.comment.findMany({
      where: {
        galleryId,
        parentId: null,
      },
      include: {
        user: true,
        replies: {
          include: {
            user: true,
            replies: true,
          },
        },
      },
    });
  }

  async createComment(dto: CreateCommentDto) {
    const comment = await this.prisma.comment.create({
      data: {
        ...dto,
      },
    });
    return comment;
  }

  async list(userId: number, dto: ListCommentsDto) {
    const page = Math.max(1, dto.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, dto.pageSize ?? 24));
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const AND: Prisma.CommentWhereInput[] = [];

    // Scope
    switch (dto.scope) {
      case 'onMyGalleries':
        AND.push({ gallery: { userId } });
        break;
      case 'authored':
        AND.push({ userId });
        break;
      case 'mentions': {
        const me = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { username: true },
        });
        const handle = me?.username ? `@${me.username}` : null;
        if (!handle) {
          // no username > nothing can match
          AND.push({ id: -1 });
        } else {
          AND.push({ text: { contains: handle, mode: 'insensitive' } });
        }
        break;
      }
    }

    // Search in comment text (independent of mentions)
    if (dto.search) {
      AND.push({ text: { contains: dto.search, mode: 'insensitive' } });
    }

    const where: Prisma.CommentWhereInput = AND.length ? { AND } : {};

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.comment.count({ where }),
      this.prisma.comment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
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
            select: {
              id: true,
              title: true,
              thumbnail: true,
            },
          },
        },
      }),
    ]);

    // Shape it for the frontend
    const items = rows.map((c) => ({
      id: c.id,
      body: c.text,
      createdAt: c.createdAt,
      author: {
        id: c.user.id,
        name: c.user.fullName ?? c.user.username,
        avatar: c.user.profile?.avatarUrl ?? null,
      },
      gallery: {
        id: c.gallery.id,
        title: c.gallery.title,
        thumbnail: this.assetUrl.thumbKeyToCdnUrl(c.gallery.thumbnail),
      },
    }));

    return { items, total, page, pageSize };
  }
}
