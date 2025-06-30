import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CommentService } from './comment.service';
// import { GetUser } from 'src/auth/decorator';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller('comments')
export class CommentController {
  constructor(private commentService: CommentService) {}

  @Get()
  getComments(@Param() galleryId: number) {
    return this.commentService.getComments(galleryId);
  }

  @Post()
  createComment(@Body() dto: CreateCommentDto) {
    return this.commentService.createComment(dto);
  }
}
