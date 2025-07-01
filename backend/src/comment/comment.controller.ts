import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CommentService } from './comment.service';
// import { GetUser } from 'src/auth/decorator';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller('comments')
export class CommentController {
  constructor(private commentService: CommentService) {}

  @Get()
  getComments(@Query('galleryId') galleryId: number) {
    return this.commentService.getComments(Number(galleryId));
  }

  @Post()
  createComment(@Body() dto: CreateCommentDto) {
    return this.commentService.createComment(dto);
  }
}
