import { UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
import { JwtGuard } from 'src/auth/guard';

describe('CommentController', () => {
  let controller: CommentController;
  const commentService = {
    getComments: jest.fn(),
    createComment: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [CommentController],
      providers: [
        {
          provide: CommentService,
          useValue: commentService,
        },
      ],
    })
      .overrideGuard(JwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(CommentController);
    Object.values(commentService).forEach((mock) => mock.mockReset());
  });

  it('retrieves comments for a gallery via query param', async () => {
    commentService.getComments.mockResolvedValue([{ id: 1 }]);
    await controller.getByGallery(10);
    expect(commentService.getComments).toHaveBeenCalledWith(10);
  });

  it('injects the authenticated user id when creating comments', async () => {
    commentService.createComment.mockResolvedValue({ id: 1 });
    await controller.createComment(
      { id: 3 } as any,
      { text: 'Hi', galleryId: 5 } as any,
    );
    expect(commentService.createComment).toHaveBeenCalledWith({
      text: 'Hi',
      galleryId: 5,
      userId: 3,
    });
  });
});
