import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}
  async replaceAvatar(
    userId: number,
    avatarUrl: string,
    avatarPublicId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.profile.findUnique({
        where: { userId },
        select: { avatarPublicId: true },
      });
      const profile = await tx.profile.upsert({
        where: { userId },
        update: { avatarUrl, avatarPublicId },
        create: { userId, avatarUrl, avatarPublicId },
      });

      return {
        profile,
        previousAvatarPublicId: existing?.avatarPublicId ?? null,
      };
    });
  }
}
