import { Module } from '@nestjs/common';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
import { MeCommentsController } from './me-comments.controller';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [CommentController, MeCommentsController],
  providers: [CommentService],
})
export class CommentModule {}
