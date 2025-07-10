import {
  // BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateGalleryDto } from './dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
// import { ProseMirrorDocSchema } from './zod/prosemirror.schema';
import { ConfigService } from '@nestjs/config';

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
          const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: path,
            ContentType: 'image/jpeg', // or dynamic based on extension
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

  getGalleries(userId: number) {
    return this.prisma.gallery.findMany({
      where: {
        userId,
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

  // async getPresignedUrls(paths: string[]) {
  //   const urls: Record<string, string> = {};
  //   for (const path of paths) {
  //     const command: PutObjectCommandInput = {
  //       Bucket: BUCKET_NAME,
  //       Key: path,
  //       ContentType: 'image/jpeg', // or infer from path
  //     };
  //     const signedUrl = await getSignedUrl(
  //       this.s3,
  //       new PutObjectCommand(command),
  //       { expiresIn: 300 },
  //     );
  //     urls[path] = signedUrl;
  //   }
  //   return urls;
  // }
}
