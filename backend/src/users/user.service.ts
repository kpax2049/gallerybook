import { Injectable } from '@nestjs/common';
import { EditUserDto } from './dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getUser(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: {
          select: {
            avatarUrl: true,
          },
        },
      },
    });
    return user;
  }

  async editUser(userId: number, dto: EditUserDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...dto,
      },
    });

    delete user.hash;
    return user;
  }

  async getUsers() {
    const users = await this.prisma.user.findMany();
    return users;
  }

  findByIdWithPasswordHash(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, hash: true },
    });
  }

  async updatePasswordAfterChange(id: number, hash: string) {
    await this.prisma.user.update({
      where: { id },
      data: {
        hash,
        passwordUpdatedAt: new Date(),
        tokenVersion: { increment: 1 }, // <- kills refresh tokens
      },
      select: { id: true },
    });
  }

  getPasswordUpdatedAt(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, passwordUpdatedAt: true },
    });
  }

  getTokenVersion(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, tokenVersion: true },
    });
  }
}
