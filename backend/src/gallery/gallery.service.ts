import { ForbiddenException, Injectable } from '@nestjs/common';
import { CreateGalleryDto } from './dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class GalleryService {
  constructor(private prisma: PrismaService) {}
  getGalleries(userId: number) {
    return this.prisma.gallery.findMany({
      where: {
        userId,
      },
    });
  }

  async createGallery(userId: number, dto: CreateGalleryDto) {
    const gallery = await this.prisma.gallery.create({
      data: {
        userId,
        ...dto,
      },
    });
    return gallery;
  }

  getGalleryById(userId: number, galleryId: number) {
    return this.prisma.gallery.findFirst({
      where: {
        id: galleryId,
        userId,
      },
    });
  }

  async editGalleryById(
    userId: number,
    galleryId: number,
    dto: CreateGalleryDto,
  ) {
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
    return this.prisma.gallery.update({
      where: {
        id: galleryId,
      },
      data: {
        ...dto,
      },
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
    await this.prisma.gallery.delete({
      where: {
        id: galleryId,
      },
    });
  }
}
