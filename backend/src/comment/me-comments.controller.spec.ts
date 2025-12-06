import { Test } from '@nestjs/testing';
import { JwtGuard } from 'src/auth/guard';
import { MeCommentsController } from './me-comments.controller';
import { CommentService } from './comment.service';

describe('MeCommentsController', () => {
  let controller: MeCommentsController;
  const commentService = {
    list: jest.fn(),
  } as Record<string, jest.Mock>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [MeCommentsController],
      providers: [{ provide: CommentService, useValue: commentService }],
    })
      .overrideGuard(JwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(MeCommentsController);
    Object.values(commentService).forEach((mock) => mock.mockReset());
  });

  it('lists authenticated user comments with provided query dto', async () => {
    const dto = { page: 2, pageSize: 10, scope: 'authored' } as any;
    commentService.list.mockResolvedValue({ items: [], total: 0 });

    await controller.listMine({ id: 9 } as any, dto);

    expect(commentService.list).toHaveBeenCalledWith(9, dto);
  });
});
