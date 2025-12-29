import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ListCommentsDto } from './dto/list-comments.dto';
import { ActionType, Prisma, ActionCount as ActionCountModel } from '@prisma/client';
import { AssetUrlService } from 'src/common/asset-url.service';

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

@Injectable()
export class CommentService {
  constructor(
    private prisma: PrismaService,
    private assetUrl: AssetUrlService,
  ) {}

  async getComments(galleryId: number, userId?: number) {
    const comments = await this.prisma.comment.findMany({
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

    const ids = this.collectCommentIds(comments);
    if (!ids.length) return comments;

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

    return this.attachReactionData(comments, countMap, selectedMap);
  }

  async createComment(dto: CreateCommentDto) {
    const comment = await this.prisma.comment.create({
      data: {
        ...dto,
      },
    });
    // ensure an ActionCount row exists for this comment so counts can be updated cheaply
    await this.prisma.actionCount
      .create({ data: { commentId: comment.id } })
      .catch(() => undefined);
    return comment;
  }

  async toggleReaction(userId: number, commentId: number, type: ActionType) {
    const field = ACTION_FIELD[type];

    return this.prisma.$transaction(async (tx) => {
      const comment = await tx.comment.findUnique({ where: { id: commentId } });
      if (!comment) throw new NotFoundException('Comment not found');

      await tx.actionCount.upsert({
        where: { commentId },
        create: { commentId },
        update: {},
      });

      const existing = await tx.reaction.findUnique({
        where: {
          commentId_userId_type: { commentId, userId, type },
        },
      });

      if (existing) {
        await tx.reaction.delete({
          where: { commentId_userId_type: { commentId, userId, type } },
        });
        await tx.actionCount.update({
          where: { commentId },
          data: { [field]: { decrement: 1 } },
        });
      } else {
        await tx.reaction.create({
          data: { commentId, userId, type },
        });
        await tx.actionCount.update({
          where: { commentId },
          data: { [field]: { increment: 1 } },
        });
      }

      const counts = await tx.actionCount.findUnique({
        where: { commentId },
      });
      const selected = await tx.reaction.findMany({
        where: { commentId, userId },
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
