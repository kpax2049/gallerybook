import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from '../auth/guard';
import { GalleryService } from './gallery.service';
import { GetUser } from 'src/auth/decorator';
import { CreateGalleryDto } from './dto';
import { PresignRequestDto } from './dto/presign-request.dto';
import { User } from '@prisma/client';
import { CreateDraftGalleryDto } from './dto/create-draft-gallery.dto';
import { UpdateGalleryContentDto } from './dto/update-gallery-content.dto';

@UseGuards(JwtGuard)
@Controller('galleries')
export class GalleryController {
  constructor(private galleryService: GalleryService) {}

  @Get()
  getGalleries(@GetUser('id') userId: number) {
    return this.galleryService.getGalleries(userId);
  }

  @Get(':id')
  async getGalleryById(
    @GetUser() user: User,
    @Param('id', ParseIntPipe) galleryId: number,
    @Query('mode') mode: 'view' | 'edit' = 'view',
  ): Promise<{ content: any }> {
    const validatedMode = mode === 'edit' ? 'edit' : 'view';

    if (validatedMode === 'edit') {
      if (!user?.id) {
        throw new UnauthorizedException('User required for edit mode');
      }

      const allowed = await this.galleryService.checkGalleryOwnershipOrAdmin(
        galleryId,
        user,
      );
      if (!allowed) {
        throw new ForbiddenException(
          'You are not allowed to edit this gallery',
        );
      }
    }

    return this.galleryService.getGalleryById(galleryId, validatedMode);
  }

  // @Post('presign')
  // async getPresignedUrls(@Body() body: PresignRequestDto) {
  //   return this.galleryService.generatePresignedUrls(body.paths);
  // }
  @Post(':id/presigned-urls')
  async getPresignedUrls(
    @Param('id', ParseIntPipe) galleryId: number,
    @Body() body: PresignRequestDto,
    @GetUser() user: User,
  ) {
    await this.galleryService.verifyOwnership(galleryId, user.id);

    const gallery = await this.galleryService.findById(galleryId);

    if (gallery.userId !== user.id) {
      throw new ForbiddenException();
    }

    return this.galleryService.generatePresignedUrls(body.paths);
  }

  @Post('draft')
  async createDraftGallery(
    @Body() dto: CreateDraftGalleryDto,
    @GetUser() user: User,
  ) {
    const gallery = await this.galleryService.createDraft(dto, user.id);
    return { id: gallery.id };
  }

  @Post()
  createGallery(@GetUser('id') userId: number, @Body() dto: CreateGalleryDto) {
    return this.galleryService.createGallery(userId, dto);
  }

  @Put(':id/content')
  async updateGalleryContent(
    @Param('id', ParseIntPipe) galleryId: number,
    @Body() dto: UpdateGalleryContentDto,
    @GetUser() user: User,
  ) {
    await this.galleryService.verifyOwnership(galleryId, user.id);

    await this.galleryService.updateContent(galleryId, dto.content);
    return { success: true };
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
