import { Test } from '@nestjs/testing';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
import { JwtGuard } from 'src/auth/guard';

describe('CommentController', () => {
  let controller: CommentController;
  const commentService = {
    getComments: jest.fn(),
    createComment: jest.fn(),
    toggleReaction: jest.fn(),
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
    const user = { id: 9, role: 'USER' } as any;
    commentService.getComments.mockResolvedValue([{ id: 1 }]);
    await controller.getByGallery(10, user);
    expect(commentService.getComments).toHaveBeenCalledWith(10, user);
  });

  it('injects the authenticated user id when creating comments', async () => {
    const user = { id: 3, role: 'USER' } as any;
    const dto = { text: 'Hi', galleryId: 5 } as any;
    commentService.createComment.mockResolvedValue({ id: 1 });
    await controller.createComment(user, dto);
    expect(commentService.createComment).toHaveBeenCalledWith(user, dto);
  });

  it('toggles reactions with the provided payload', async () => {
    const user = { id: 4, role: 'USER' } as any;
    commentService.toggleReaction.mockResolvedValue({ active: true });
    await controller.toggleReaction(user, 15, { type: 'UPVOTE' } as any);
    expect(commentService.toggleReaction).toHaveBeenCalledWith(
      user,
      15,
      'UPVOTE',
    );
  });
});
