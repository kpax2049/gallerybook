import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { GetUser } from 'src/auth/decorator';
import { User } from '@prisma/client';
import { JwtGuard } from 'src/auth/guard';
import { ToggleReactionDto } from './dto/toggle-reaction.dto';

@UseGuards(JwtGuard)
@Controller('comments')
export class CommentController {
  constructor(private commentService: CommentService) {}

  @Get()
  getByGallery(
    @Query('galleryId', ParseIntPipe) galleryId: number,
    @GetUser() user?: User,
  ) {
    return this.commentService.getComments(galleryId, user);
  }

  @Post()
  createComment(@GetUser() user: User, @Body() dto: CreateCommentDto) {
    return this.commentService.createComment({ ...dto, userId: user.id });
  }

  @Post(':id/reactions/toggle')
  toggleReaction(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) commentId: number,
    @Body() dto: ToggleReactionDto,
  ) {
    return this.commentService.toggleReaction(userId, commentId, dto.type);
  }
}
