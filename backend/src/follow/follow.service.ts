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

  async listFollowing(meId: number, q?: string, skip = 0, take = 50) {
    const ids = await this.prisma.follow.findMany({
      where: { followerId: meId },
      select: { followingId: true },
    });
    const followingIds = ids.map((r) => r.followingId);
    if (followingIds.length === 0) return [];

    const users = await this.prisma.user.findMany({
      where: {
        id: { in: followingIds },
        ...(q
          ? {
              OR: [
                { fullName: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        profile: { select: { avatarUrl: true } },
      },
      orderBy: { fullName: 'asc' },
      skip,
      take,
    });

    return users.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      avatarUrl: u.profile?.avatarUrl ?? null,
    }));
  }

  async followingIds(meId: number) {
    const rows = await this.prisma.follow.findMany({
      where: { followerId: meId },
      select: { followingId: true },
    });
    return rows.map((r) => r.followingId);
  }
}
