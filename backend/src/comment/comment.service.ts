import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ListCommentsDto } from './dto/list-comments.dto';
import { ListGalleryCommentsDto } from './dto/list-gallery-comments.dto';
import {
  ActionType,
  GalleryStatus,
  Prisma,
  ActionCount as ActionCountModel,
  User,
  Visibility,
} from '@prisma/client';
import { AssetUrlService } from 'src/common/asset-url.service';
import { canReadGallery } from 'src/gallery/gallery-access';

const ACTION_FIELD: Record<ActionType, keyof Prisma.ActionCountUpdateInput> = {
  THUMB_UP: 'thumbUp',
  THUMB_DOWN: 'thumbDown',
  LAUGH: 'laugh',
  HOORAY: 'hooray',
  CONFUSED: 'confused',
  HEART: 'heart',
  ROCKET: 'rocket',
  EYE: 'eye',
  UPVOTE: 'upvote',
};

const COMMENT_REPLY_INCLUDE_DEPTH = 8;
const COMMENT_THREAD_ORDER: Prisma.CommentOrderByWithRelationInput[] = [
  { createdAt: 'asc' },
  { id: 'asc' },
];

@Injectable()
export class CommentService {
  constructor(
    private prisma: PrismaService,
    private assetUrl: AssetUrlService,
  ) {}

  async getComments(
    galleryId: number,
    user?: Pick<User, 'id' | 'role'>,
    dto: ListGalleryCommentsDto = {},
  ) {
    const gallery = await this.prisma.gallery.findUnique({
      where: { id: galleryId },
      select: { status: true, visibility: true },
    });
    this.assertGalleryReadable(gallery, user);

    const userId = user?.id;
    const page = Math.max(1, dto.page ?? 1);
    const pageSize = Math.min(50, Math.max(1, dto.pageSize ?? 24));
    const skip = (page - 1) * pageSize;
    const where = { galleryId, parentId: null };
    const comments = await this.prisma.comment.findMany({
      where,
      orderBy: COMMENT_THREAD_ORDER,
      skip,
      take: pageSize,
      include: {
        user: true,
        replies: this.buildRepliesArgs(COMMENT_REPLY_INCLUDE_DEPTH),
      },
    });

    const ids = this.collectCommentIds(comments);
    const total = await this.prisma.comment.count({ where });
    if (!ids.length) return { items: comments, total, page, pageSize };

    const [counts, myReactions] = await Promise.all([
      this.prisma.actionCount.findMany({
        where: { commentId: { in: ids } },
      }),
      userId
        ? this.prisma.reaction.findMany({
            where: { commentId: { in: ids }, userId },
            select: { commentId: true, type: true },
          })
        : Promise.resolve([]),
    ]);

    const countMap = new Map<number, ActionCountModel>(
      counts.map((c) => [c.commentId, c]),
    );
    const selectedMap = new Map<number, ActionType[]>();
    for (const r of myReactions) {
      const list = selectedMap.get(r.commentId) ?? [];
      list.push(r.type);
      selectedMap.set(r.commentId, list);
    }

    return {
      items: this.attachReactionData(comments, countMap, selectedMap),
      total,
      page,
      pageSize,
    };
  }

  async createComment(user: Pick<User, 'id' | 'role'>, dto: CreateCommentDto) {
    return this.prisma.$transaction(async (tx) => {
      const gallery = await tx.gallery.findUnique({
        where: { id: dto.galleryId },
        select: { status: true, visibility: true },
      });
      this.assertGalleryReadable(gallery, user);

      if (dto.parentId !== undefined) {
        const parent = await tx.comment.findUnique({
          where: { id: dto.parentId },
          select: { galleryId: true },
        });
        if (!parent || parent.galleryId !== dto.galleryId) {
          throw new NotFoundException('Parent comment not found');
        }
      }

      const comment = await tx.comment.create({
        data: {
          ...dto,
          userId: user.id,
        },
        include: {
          user: {
            include: {
              profile: true,
            },
          },
        },
      });
      const count = await tx.actionCount.create({
        data: { commentId: comment.id },
      });

      return {
        ...comment,
        actions: this.toActionMap(count),
        selectedActions: [],
        replies: [],
      };
    });
  }

  async toggleReaction(
    user: Pick<User, 'id' | 'role'>,
    commentId: number,
    type: ActionType,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const comment = await tx.comment.findUnique({
        where: { id: commentId },
        select: {
          id: true,
          gallery: {
            select: { status: true, visibility: true },
          },
        },
      });
      if (!comment || !canReadGallery(comment.gallery, user)) {
        throw new NotFoundException('Comment not found');
      }

      await tx.actionCount.upsert({
        where: { commentId },
        create: { commentId },
        update: {},
      });

      const existing = await tx.reaction.findUnique({
        where: {
          commentId_userId_type: { commentId, userId: user.id, type },
        },
      });

      if (existing) {
        await tx.reaction.deleteMany({
          where: { commentId, userId: user.id, type },
        });
      } else {
        await tx.reaction.createMany({
          data: [{ commentId, userId: user.id, type }],
          skipDuplicates: true,
        });
      }

      const counts = await this.reconcileCommentActionCounts(tx, commentId);
      const selected = await tx.reaction.findMany({
        where: { commentId, userId: user.id },
        select: { type: true },
      });

      return {
        active: !existing,
        actions: this.toActionMap(counts),
        selectedActions: selected.map((r) => r.type),
      };
    });
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
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
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

  private assertGalleryReadable(
    gallery: { status: GalleryStatus; visibility: Visibility } | null,
    user?: Pick<User, 'role'>,
  ) {
    if (!gallery || !canReadGallery(gallery, user)) {
      throw new NotFoundException('Gallery not found');
    }
  }

  private collectCommentIds(comments: any[]): number[] {
    const ids: number[] = [];
    const visit = (list: any[]) => {
      for (const c of list) {
        ids.push(c.id);
        if (Array.isArray(c.replies) && c.replies.length) visit(c.replies);
      }
    };
    visit(comments);
    return ids;
  }

  private buildReplyInclude(depth: number): Prisma.CommentInclude {
    if (depth <= 0) {
      return { user: true };
    }

    return {
      user: true,
      replies: this.buildRepliesArgs(depth - 1),
    };
  }

  private buildRepliesArgs(depth: number): Prisma.Comment$repliesArgs {
    return {
      orderBy: COMMENT_THREAD_ORDER,
      include: this.buildReplyInclude(depth),
    };
  }

  private toActionMap(count?: ActionCountModel) {
    return {
      [ActionType.THUMB_UP]: count?.thumbUp ?? 0,
      [ActionType.THUMB_DOWN]: count?.thumbDown ?? 0,
      [ActionType.LAUGH]: count?.laugh ?? 0,
      [ActionType.HOORAY]: count?.hooray ?? 0,
      [ActionType.CONFUSED]: count?.confused ?? 0,
      [ActionType.HEART]: count?.heart ?? 0,
      [ActionType.ROCKET]: count?.rocket ?? 0,
      [ActionType.EYE]: count?.eye ?? 0,
      [ActionType.UPVOTE]: count?.upvote ?? 0,
    };
  }

  private async reconcileCommentActionCounts(
    client: Pick<PrismaService, 'reaction' | 'actionCount'>,
    commentId: number,
  ) {
    const grouped = await client.reaction.groupBy({
      by: ['type'],
      where: { commentId },
      _count: { _all: true },
    });
    const countByType = new Map(
      grouped.map((row) => [row.type, row._count._all]),
    );
    const data = Object.fromEntries(
      (Object.values(ActionType) as ActionType[]).map((type) => [
        ACTION_FIELD[type],
        countByType.get(type) ?? 0,
      ]),
    ) as Prisma.ActionCountUpdateInput;

    return client.actionCount.update({
      where: { commentId },
      data,
    });
  }

  private attachReactionData(
    comments: any[],
    countMap: Map<number, ActionCountModel>,
    selectedMap: Map<number, ActionType[]>,
  ) {
    return comments.map((c) => ({
      ...c,
      actions: this.toActionMap(countMap.get(c.id)),
      selectedActions: selectedMap.get(c.id) ?? [],
      replies: c.replies
        ? this.attachReactionData(c.replies, countMap, selectedMap)
        : c.replies,
    }));
  }
}
