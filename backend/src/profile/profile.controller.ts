import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtGuard } from 'src/auth/guard/jwt.guard';
import { ProfileService } from './profile.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { cloudinary } from 'src/cloudinary/cloudinary.config';
import { randomUUID } from 'crypto';
import { GetUser } from 'src/auth/decorator';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';

const isSupportedAvatarImage = (data: Buffer) => {
  const isPng =
    data.length >= 8 &&
    data
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isJpeg =
    data.length >= 3 &&
    data[0] === 0xff &&
    data[1] === 0xd8 &&
    data[2] === 0xff;
  const isWebp =
    data.length >= 12 &&
    data.subarray(0, 4).equals(Buffer.from('RIFF')) &&
    data.subarray(8, 12).equals(Buffer.from('WEBP'));

  return isPng || isJpeg || isWebp;
};

@UseGuards(JwtGuard)
@Controller('profile')
export class ProfileController {
  constructor(private profileService: ProfileService) {}

  @Post('upload-avatar')
  // Telling Multer to store the file to disk, so file.path will be defined for cloudinary
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          try {
            fs.mkdirSync('./temp_uploads', { recursive: true });
            cb(null, './temp_uploads');
          } catch (err) {
            cb(err as Error, './temp_uploads');
          }
        },
        filename: (req, file, cb) => cb(null, randomUUID()),
      }),
      limits: {
        fileSize: 1024 * 1024,
      },
    }),
  )
  async uploadAvatar(
    @GetUser('id') userId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    let result: { secure_url?: string; public_id?: string } | undefined;

    try {
      const imageData = await fs.promises.readFile(file.path);
      if (!isSupportedAvatarImage(imageData)) {
        throw new BadRequestException(
          'Avatar must be a PNG, JPEG, or WebP image',
        );
      }

      result = await cloudinary.uploader.upload(file.path, {
        folder: 'avatars',
        public_id: randomUUID(),
        resource_type: 'image',
      });

      if (!result?.secure_url || !result.public_id) {
        throw new Error('Cloudinary response missing avatar metadata');
      }
      let previousAvatarPublicId: string | null;
      try {
        ({ previousAvatarPublicId } = await this.profileService.replaceAvatar(
          userId,
          result.secure_url,
          result.public_id,
        ));
      } catch (error) {
        await this.destroyAvatar(result.public_id);
        throw error;
      }

      if (
        previousAvatarPublicId &&
        previousAvatarPublicId !== result.public_id
      ) {
        await this.destroyAvatar(previousAvatarPublicId);
      }

      return {
        url: result.secure_url,
        public_id: result.public_id,
      };
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      console.error('Upload failed:', err);
      throw new InternalServerErrorException('Avatar upload failed');
    } finally {
      // Cleanup local disk uploads
      try {
        await fs.promises.unlink(file.path);
      } catch (cleanupErr) {
        console.warn('Failed to delete temp file:', file.path, cleanupErr);
      }
    }
  }

  private async destroyAvatar(publicId: string) {
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    } catch (error) {
      console.warn('Failed to delete Cloudinary avatar:', publicId, error);
    }
  }
}
