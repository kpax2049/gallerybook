// src/comment/me-comments.controller.ts
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { GetUser } from 'src/auth/decorator';
import { User } from '@prisma/client';
import { ListCommentsDto } from './dto/list-comments.dto';
import { CommentService } from './comment.service';
import { JwtGuard } from 'src/auth/guard';

@UseGuards(JwtGuard)
@Controller('me/comments')
export class MeCommentsController {
  constructor(private readonly commentService: CommentService) {}

  @Get()
  listMine(@GetUser() user: User, @Query() dto: ListCommentsDto) {
    return this.commentService.list(user.id, dto);
  }
}
