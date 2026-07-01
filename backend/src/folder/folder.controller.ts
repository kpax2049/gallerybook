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
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Role, User } from '@prisma/client';
import { GetUser } from 'src/auth/decorator';
import { JwtGuard } from 'src/auth/guard';
import { CreateFolderDto, UpdateFolderDto } from './dto';
import { FolderService } from './folder.service';

@UseGuards(JwtGuard)
@Controller('folders')
export class FolderController {
  constructor(private readonly folderService: FolderService) {}

  @Get()
  list(@GetUser() user: User) {
    this.requireUser(user);
    return this.folderService.listForUser(user.id);
  }

  @Post()
  create(@GetUser() user: User, @Body() dto: CreateFolderDto) {
    this.requireAdmin(user);
    return this.folderService.create(user.id, dto);
  }

  @Patch(':id')
  update(
    @GetUser() user: User,
    @Param('id', ParseIntPipe) folderId: number,
    @Body() dto: UpdateFolderDto,
  ) {
    this.requireAdmin(user);
    return this.folderService.update(user.id, folderId, dto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async delete(
    @GetUser() user: User,
    @Param('id', ParseIntPipe) folderId: number,
  ) {
    this.requireAdmin(user);
    await this.folderService.delete(user.id, folderId);
  }

  private requireUser(user?: User) {
    if (!user?.id) {
      throw new UnauthorizedException('User required');
    }
  }

  private requireAdmin(user?: User) {
    this.requireUser(user);
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Admin access required');
    }
  }
}
