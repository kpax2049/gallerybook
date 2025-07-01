import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentService {
  constructor(private prisma: PrismaService) {}

  getComments(galleryId: number) {
    return this.prisma.comment.findMany({
      where: {
        galleryId,
        parentId: null,
      },
      include: {
        user: true,
        replies: {
          include: {
            user: true,
            replies: true,
          },
        },
      },
    });
  }

  async createComment(dto: CreateCommentDto) {
    const comment = await this.prisma.comment.create({
      data: {
        ...dto,
      },
    });
    return comment;
  }
}
