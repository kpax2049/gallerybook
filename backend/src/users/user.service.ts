import { Injectable } from '@nestjs/common';
import { EditUserDto } from './dto';
import { PrismaService } from 'src/prisma/prisma.service';

const SAFE_USER_SELECT = {
  id: true,
  createdAt: true,
  updatedAt: true,
  role: true,
  email: true,
  fullName: true,
  username: true,
  settings: true,
  status: true,
  profile: {
    select: {
      avatarUrl: true,
    },
  },
} as const;

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getUser(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: SAFE_USER_SELECT,
    });
    return user;
  }

  async editUser(userId: number, dto: EditUserDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...dto,
      },
      select: SAFE_USER_SELECT,
    });

    return user;
  }

  async getUsers() {
    const users = await this.prisma.user.findMany({
      select: SAFE_USER_SELECT,
    });
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
      select: { id: true, email: true, tokenVersion: true },
    });
  }
}
