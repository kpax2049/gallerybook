import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from '../auth/guard';
import { GalleryService } from './gallery.service';
import { GetUser } from 'src/auth/decorator';
import { CreateGalleryDto } from './dto';

@UseGuards(JwtGuard)
@Controller('galleries')
export class GalleryController {
  constructor(private galleryService: GalleryService) {}

  @Get()
  getGalleries(@GetUser('id') userId: number) {
    return this.galleryService.getGalleries(userId);
  }

  @Get(':id')
  getGalleryById(
    @GetUser('id') userId: number,

    @Param('id', ParseIntPipe) galleryId: number,
  ) {
    return this.galleryService.getGalleryById(userId, galleryId);
  }

  @Post()
  createGallery(@GetUser('id') userId: number, @Body() dto: CreateGalleryDto) {
    return this.galleryService.createGallery(userId, dto);
  }

  @Patch(':id')
  editGalleryById(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) galleryId: number,
    @Body() dto: CreateGalleryDto,
  ) {
    return this.galleryService.editGalleryById(userId, galleryId, dto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  deleteGalleryById(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) galleryId: number,
  ) {
    return this.galleryService.deleteGalleryById(userId, galleryId);
  }
}
