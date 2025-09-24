import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class FollowService {
  constructor(private prisma: PrismaService) {}

  async follow(meId: number, userId: number) {
    if (meId === userId)
      throw new BadRequestException("You can't follow yourself.");
    await this.prisma.follow
      .create({ data: { followerId: meId, followingId: userId } })
      .catch((e) => {
        if (e.code === 'P2002') return; // already following
        throw e;
      });
    return { ok: true };
  }

  async unfollow(meId: number, userId: number) {
    await this.prisma.follow
      .delete({
        where: {
          followerId_followingId: { followerId: meId, followingId: userId },
        },
      })
      .catch(() => null); // if not found, treat as idempotent success
    return { ok: true };
  }

  async listFollowing(meId: number, q?: string, take = 50, skip = 0) {
    const rows = await this.prisma.follow.findMany({
      where: {
        followerId: meId,
        ...(q && {
          following: {
            OR: [
              { fullName: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
            ],
          },
        }),
      },
      include: {
        following: {
          select: {
            id: true,
            fullName: true,
            email: true,
            profile: { select: { avatarUrl: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    });

    // flatten to a clean DTO
    return rows.map((r) => ({
      id: r.following.id,
      fullName: r.following.fullName,
      email: r.following.email,
      avatarUrl: r.following.profile?.avatarUrl ?? null,
    }));
  }
}
