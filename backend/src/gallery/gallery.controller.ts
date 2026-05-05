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
import { Role, User } from '@prisma/client';
import { CreateDraftGalleryDto } from './dto/create-draft-gallery.dto';
import { UpdateGalleryContentDto } from './dto/update-gallery-content.dto';
import { UpdateGalleryDto } from './dto/update-gallery-dto';
import { ListGalleriesDto } from './dto/list-galleries.dto';
import { ToggleReactionDto } from './dto/toggle-reaction.dto';
import { UpsertTagsDto } from './dto/upsert-tags.dto';

@UseGuards(JwtGuard)
@Controller('galleries')
export class GalleryController {
  constructor(private galleryService: GalleryService) {}

  // @Get()
  // getGalleries(@GetUser('id') userId: number) {
  //   return this.galleryService.getGalleries(userId);
  // }

  @Get(':id')
  async getGalleryById(
    @GetUser() user: User,
    @Param('id', ParseIntPipe) galleryId: number,
    @Query('mode') mode: 'view' | 'edit' = 'view',
  ): Promise<{ content: any }> {
    const validatedMode = mode === 'edit' ? 'edit' : 'view';

    if (validatedMode === 'edit') {
      this.requireAdmin(user);
    }

    return this.galleryService.getGalleryById(
      galleryId,
      validatedMode,
      user,
    );
  }

  @Post(':id/presigned-urls')
  async getPresignedUrls(
    @Param('id', ParseIntPipe) galleryId: number,
    @Body() body: PresignRequestDto,
    @GetUser() user: User,
  ) {
    this.requireAdmin(user);
    await this.galleryService.verifyManageAccess(galleryId, user);

    return this.galleryService.generatePresignedUrls(body.paths);
  }

  @Post('draft')
  async createDraftGallery(
    @Body() dto: CreateDraftGalleryDto,
    @GetUser() user: User,
  ) {
    this.requireAdmin(user);
    const gallery = await this.galleryService.createDraft(dto, user.id);
    return { id: gallery.id };
  }

  @Post()
  createGallery(@GetUser() user: User, @Body() dto: CreateGalleryDto) {
    this.requireAdmin(user);
    return this.galleryService.createGallery(user.id, dto);
  }

  @Put(':id/content')
  async updateGalleryContent(
    @Param('id', ParseIntPipe) galleryId: number,
    @Body() dto: UpdateGalleryContentDto,
    @GetUser() user: User,
  ) {
    this.requireAdmin(user);
    await this.galleryService.verifyManageAccess(galleryId, user);

    await this.galleryService.updateContent(galleryId, dto.content);
    return { success: true };
  }

  @Patch(':id')
  editGalleryById(
    @GetUser() user: User,
    @Param('id', ParseIntPipe) galleryId: number,
    @Body() dto: UpdateGalleryDto,
  ) {
    this.requireAdmin(user);
    return this.galleryService.editGalleryById(user, galleryId, dto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  deleteGalleryById(
    @GetUser() user: User,
    @Param('id', ParseIntPipe) galleryId: number,
  ) {
    this.requireAdmin(user);
    return this.galleryService.deleteGalleryById(user, galleryId);
  }

  @Delete(':id/images')
  async deleteUnusedImages(
    @GetUser() user: User,
    @Param('id', ParseIntPipe) galleryId: number,
    @Body() body: { keys: string[] },
  ) {
    this.requireAdmin(user);
    // Validate keys start with correct gallery prefix
    const gallery = await this.galleryService.findById(galleryId);
    const userId = gallery.userId;
    const galleryPrefix = `uploads/users/${userId}/galleries/${galleryId}/`;
    const safeKeys = body.keys.filter((key) => key.startsWith(galleryPrefix));

    if (safeKeys.length === 0) {
      return { deleted: 0 };
    }

    await this.galleryService.deleteImagesFromS3(safeKeys);
    return { deleted: safeKeys.length };
  }

  @UseGuards(JwtGuard)
  @Get()
  async list(@GetUser() user: User, @Query() dto: ListGalleriesDto) {
    const userId = user?.id ?? null;
    return this.galleryService.list(userId, dto, user?.role);
  }

  @UseGuards(JwtGuard)
  @Post(':id/reactions/toggle')
  async toggleReaction(
    @GetUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ToggleReactionDto,
  ) {
    return this.galleryService.toggleReaction(user.id, id, body.type as any);
  }

  @UseGuards(JwtGuard)
  @Get(':id/reactions/my')
  async myReactions(
    @GetUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.galleryService.getMyReactions(user.id, id);
  }

  @UseGuards(JwtGuard)
  @Patch(':id/tags')
  async replaceTags(
    @GetUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpsertTagsDto,
  ) {
    this.requireAdmin(user);
    const tags = Array.isArray(body?.tags) ? body.tags : [];
    return this.galleryService.replaceTags(user.id, id, tags);
  }

  @Get('slug/:slug')
  getBySlug(
    @GetUser() user: User,
    @Param('slug') slug: string,
    @Query('mode') mode: 'view' | 'edit' = 'view',
  ): Promise<{ content: any }> {
    const validatedMode = mode === 'edit' ? 'edit' : 'view';
    if (validatedMode === 'edit') {
      this.requireAdmin(user);
    }
    return this.galleryService.getGalleryBySlug(slug, validatedMode, user);
  }

  private requireAdmin(user?: User) {
    if (!user?.id) {
      throw new UnauthorizedException('User required');
    }
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Admin access required');
    }
  }
}
