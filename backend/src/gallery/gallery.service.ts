import {
  BadRequestException,
  // BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateGalleryDto } from './dto';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
// import { ProseMirrorDocSchema } from './zod/prosemirror.schema';
import { ConfigService } from '@nestjs/config';
import { GalleryStatus, User } from '@prisma/client';
import { Role } from '@prisma/client';
import { extname } from 'path';
import { lookup as mimeLookup } from 'mime-types';
import { CreateDraftGalleryDto } from './dto/create-draft-gallery.dto';

type Mode = 'edit' | 'view';

const allowedMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
];

interface ProseMirrorNode {
  type: string;
  attrs?: Record<string, any>;
  content?: ProseMirrorNode[];
}

@Injectable()
export class GalleryService {
  private s3: S3Client;
  private readonly bucket: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.bucket = this.config.get<string>(
      'S3_BUCKET_NAME',
      'gallerybook-images',
    );

    this.s3 = new S3Client({
      region: this.config.get<string>('AWS_REGION'),
      credentials: {
        accessKeyId: this.config.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.config.get<string>('AWS_SECRET_ACCESS_KEY'),
      },
    });
  }

  async generatePresignedUrls(
    paths: string[],
  ): Promise<Record<string, string>> {
    const result: Record<string, string> = {};

    try {
      await Promise.all(
        paths.map(async (path) => {
          const ext = extname(path); // e.g. ".webp"
          const mime = mimeLookup(ext) || '';
          const normalizedType = mime === 'image/jpg' ? 'image/jpeg' : mime;

          if (!allowedMimeTypes.includes(normalizedType)) {
            throw new BadRequestException(`Unsupported image type: ${mime}`);
          }
          const contentType = mimeLookup(ext) || 'application/octet-stream'; // fallback safe type

          const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: path,
            ContentType: contentType,
          });

          const url = await getSignedUrl(this.s3, command, { expiresIn: 300 });
          result[path] = url;
        }),
      );

      return result;
    } catch (error) {
      console.error('S3 presign error:', error);
      throw new InternalServerErrorException(
        'Could not generate presigned URLs',
      );
    }
  }

  async rewriteImageSrcsInNode(
    node: ProseMirrorNode,
    mode: Mode,
  ): Promise<ProseMirrorNode> {
    const updatedNode: ProseMirrorNode = { ...node };

    // Rewrite image src
    if (node.type === 'image' && node.attrs?.src) {
      const originalSrc = node.attrs.src; // e.g., 'uploads/user1/photo.jpg'

      if (mode === 'view') {
        // Replace with CloudFront + transforms
        const cloudfrontDomain = this.config.get<string>('CLOUDFRONT_DOMAIN');
        const transformParams = this.config.get<string>(
          'LAMBDA_TRANSFORM_PARAMS',
        );
        updatedNode.attrs = {
          ...updatedNode.attrs,
          src: `${cloudfrontDomain}/${originalSrc}?${transformParams}`,
        };
      } else if (mode === 'edit') {
        // Replace with presigned S3 URL
        const command = new GetObjectCommand({
          Bucket: this.bucket,
          Key: originalSrc,
        });

        const signedUrl = await getSignedUrl(this.s3, command, {
          expiresIn: 300,
        }); // 5 minutes
        updatedNode.attrs = {
          ...updatedNode.attrs,
          src: signedUrl,
        };
      }
    }

    // Recursively process content
    if (node.content && Array.isArray(node.content)) {
      updatedNode.content = await Promise.all(
        node.content.map((child) => this.rewriteImageSrcsInNode(child, mode)),
      );
    }

    return updatedNode;
  }

  async rewriteGalleryImageSrcs(
    content: any,
    mode: Mode,
  ): Promise<ProseMirrorNode> {
    return await this.rewriteImageSrcsInNode(content, mode);
  }

  async checkGalleryOwnershipOrAdmin(
    galleryId: number,
    user: User,
  ): Promise<boolean> {
    // Admins can bypass ownership
    if (user.role === Role.ADMIN) return true;

    const gallery = await this.prisma.gallery.findUnique({
      where: { id: galleryId },
      select: { userId: true },
    });

    if (!gallery) return false;
    return gallery.userId === user.id;
  }

  async verifyOwnership(galleryId: number, userId: number) {
    const gallery = await this.prisma.gallery.findUnique({
      where: { id: galleryId },
    });

    if (!gallery) throw new NotFoundException();
    if (gallery.userId !== userId) throw new ForbiddenException();
  }

  getGalleries(userId: number) {
    return this.prisma.gallery.findMany({
      where: {
        userId,
      },
    });
  }

  async createDraft(dto: CreateDraftGalleryDto, userId: number) {
    return this.prisma.gallery.create({
      data: {
        title: dto.title,
        description: dto.description,
        thumbnail: dto.thumbnail,
        userId,
      },
    });
  }

  async updateContent(galleryId: number, content: any) {
    return this.prisma.gallery.update({
      where: { id: galleryId },
      data: {
        content,
        status: GalleryStatus.PUBLISHED,
        updatedAt: new Date(),
      },
    });
  }

  async createGallery(userId: number, dto: CreateGalleryDto) {
    try {
      // const parsed = ProseMirrorDocSchema.parse(dto.content);

      const gallery = await this.prisma.gallery.create({
        data: {
          userId,
          ...dto,
          // ...{ ...dto, content: parsed },
        },
      });
      return gallery;
    } catch (err) {
      console.log(err);
      // throw new BadRequestException('Invalid ProseMirror content');
    }
  }

  async getGalleryById(galleryId: number, mode: 'view' | 'edit') {
    const gallery = this.prisma.gallery.findUnique({
      where: {
        id: galleryId,
      },
    });
    if (!gallery) {
      throw new Error('Gallery not found'); // or your preferred error handling
    }

    if (mode === 'view') {
      // const cacheKey = this.getCacheKey(galleryId);
      // const cached = await this.cacheManager.get(cacheKey);
      // if (cached) {
      //   return { ...gallery, content: cached };
      // }

      // Rewrite URLs to CloudFront + transforms for viewing
      const rewritten = await this.rewriteGalleryImageSrcs(
        (await gallery).content,
        'view',
      );

      // // Cache rewritten JSON for 1 hour
      // await this.cacheManager.set(cacheKey, rewritten, { ttl: 3600 });

      return { ...gallery, content: rewritten };
    } else {
      // Edit mode — always fresh, presigned S3 URLs
      const rewritten = await this.rewriteGalleryImageSrcs(
        (await gallery).content,
        'edit',
      );
      return { ...gallery, content: rewritten };
    }
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

  async findById(galleryId: number) {
    const gallery = await this.prisma.gallery.findUnique({
      where: { id: galleryId },
    });

    if (!gallery) {
      throw new NotFoundException(`Gallery with ID ${galleryId} not found`);
    }

    return gallery;
  }
}
