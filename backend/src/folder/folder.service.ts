import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AssetUrlService } from 'src/common/asset-url.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { slugify } from 'src/utils/slug.util';
import { CreateFolderDto, UpdateFolderDto } from './dto';

@Injectable()
export class FolderService {
  constructor(
    private prisma: PrismaService,
    private assetUrl: AssetUrlService,
  ) {}

  private readonly folderInclude = {
    _count: { select: { galleries: true } },
    coverGallery: {
      select: {
        id: true,
        title: true,
        thumbnail: true,
        slug: true,
        folderId: true,
      },
    },
  };

  async listForUser(userId: number) {
    const folders = await this.prisma.folder.findMany({
      where: { userId },
      orderBy: [{ updatedAt: 'desc' }, { name: 'asc' }],
      include: this.folderInclude,
    });

    return folders.map((folder) => this.mapFolder(folder));
  }

  async create(userId: number, dto: CreateFolderDto) {
    const name = dto.name.trim();
    const slug = await this.generateUniqueSlug(userId, name);
    const coverGalleryId = await this.resolveCoverGalleryIdForOwner(
      userId,
      dto.coverGalleryId,
    );

    const folder = await this.prisma.folder.create({
      data: {
        userId,
        name,
        slug,
        description: dto.description,
        color: dto.color,
        ...(coverGalleryId !== undefined ? { coverGalleryId } : {}),
      },
      include: this.folderInclude,
    });

    return this.mapFolder(folder);
  }

  async update(userId: number, folderId: number, dto: UpdateFolderDto) {
    const existing = await this.getOwnedFolder(userId, folderId);
    const nextName = dto.name?.trim();
    const slug =
      nextName && nextName !== existing.name
        ? await this.generateUniqueSlug(userId, nextName, folderId)
        : undefined;
    const coverGalleryId =
      dto.coverGalleryId !== undefined
        ? await this.resolveCoverGalleryIdForOwner(userId, dto.coverGalleryId)
        : undefined;

    const folder = await this.prisma.folder.update({
      where: { id: folderId },
      data: {
        ...(nextName ? { name: nextName } : {}),
        ...(slug ? { slug } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description ?? null }
          : {}),
        ...(dto.color !== undefined ? { color: dto.color ?? null } : {}),
        ...(coverGalleryId !== undefined ? { coverGalleryId } : {}),
      },
      include: this.folderInclude,
    });

    return this.mapFolder(folder);
  }

  async delete(userId: number, folderId: number) {
    await this.getOwnedFolder(userId, folderId);
    await this.prisma.folder.delete({ where: { id: folderId } });
    return { ok: true };
  }

  async getOwnedFolder(userId: number, folderId: number) {
    const folder = await this.prisma.folder.findUnique({
      where: { id: folderId },
    });

    if (!folder) throw new NotFoundException('Folder not found');
    if (folder.userId !== userId) throw new ForbiddenException();

    return folder;
  }

  private async generateUniqueSlug(
    userId: number,
    name: string,
    excludeId?: number,
  ) {
    const base = slugify(name);
    let candidate = base;
    let suffix = 2;

    while (
      await this.prisma.folder.findFirst({
        where: {
          userId,
          slug: candidate,
          ...(excludeId ? { id: { not: excludeId } } : {}),
        },
        select: { id: true },
      })
    ) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }

    return candidate;
  }

  private async resolveCoverGalleryIdForOwner(
    userId: number,
    coverGalleryId: number | null | undefined,
  ) {
    if (coverGalleryId === undefined || coverGalleryId === null) {
      return coverGalleryId;
    }

    const gallery = await this.prisma.gallery.findUnique({
      where: { id: coverGalleryId },
      select: { userId: true },
    });

    if (!gallery || gallery.userId !== userId) {
      throw new NotFoundException('Gallery not found');
    }

    return coverGalleryId;
  }

  private mapFolder(folder: any) {
    return {
      id: folder.id,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt,
      name: folder.name,
      slug: folder.slug,
      description: folder.description,
      color: folder.color,
      coverGalleryId: folder.coverGalleryId,
      userId: folder.userId,
      galleriesCount: folder._count?.galleries ?? 0,
      coverGallery: folder.coverGallery
        ? {
            ...folder.coverGallery,
            thumbnail: this.assetUrl.thumbKeyToCdnUrl(
              folder.coverGallery.thumbnail,
            ),
          }
        : null,
    };
  }
}
