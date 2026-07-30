import { Module } from '@nestjs/common';
import {
  GalleryController,
  PublicGalleryController,
} from './gallery.controller';
import { GalleryService } from './gallery.service';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [CommonModule],
  providers: [GalleryService],
  controllers: [GalleryController, PublicGalleryController],
})
export class GalleryModule {}
