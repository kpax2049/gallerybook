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
import { v4 as uuidv4 } from 'uuid';
import { GetUser } from 'src/auth/decorator';
import { diskStorage } from 'multer';
import * as fs from 'fs/promises';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';

@UseGuards(JwtGuard)
@Controller('profile')
export class ProfileController {
  constructor(private profileService: ProfileService) {}

  @Post('upload-avatar')
  // Telling Multer to store the file to disk, so file.path will be defined for cloudinary
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './temp_uploads',
        filename: (req, file, cb) => {
          const uniqueName = `${Date.now()}-${file.originalname}`;
          cb(null, uniqueName);
        },
      }),
    }),
  )
  async uploadAvatar(
    @GetUser('id') userId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    let result;

    try {
      result = await cloudinary.uploader.upload(file.path, {
        folder: 'avatars',
        public_id: uuidv4(),
      });

      if (!result?.secure_url) {
        throw new Error('Cloudinary response missing secure_url');
      }
      // Update profile.avatarUrl in DB
      await this.profileService.updateAvatarUrl(userId, result.secure_url);

      return {
        url: result.secure_url,
        public_id: result.public_id,
      };
    } catch (err) {
      console.error('Upload failed:', err);
      throw new InternalServerErrorException('Avatar upload failed');
    } finally {
      // Cleanup local disk uploads
      try {
        await fs.unlink(file.path);
      } catch (cleanupErr) {
        console.warn('Failed to delete temp file:', file.path, cleanupErr);
      }
    }
  }
}
