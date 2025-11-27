import { UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { FollowController } from './follow.controller';
import { FollowService } from './follow.service';
import { JwtGuard } from 'src/auth/guard';
import { FollowingQueryDto } from './dto';

describe('FollowController', () => {
  let controller: FollowController;
  const followService = {
    follow: jest.fn(),
    unfollow: jest.fn(),
    listFollowing: jest.fn(),
    followingIds: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [FollowController],
      providers: [
        {
          provide: FollowService,
          useValue: followService,
        },
      ],
    })
      .overrideGuard(JwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(FollowController);
    Object.values(followService).forEach((mock) => mock.mockReset());
  });

  const makeReq = (id?: number) => ({ user: id ? { id } : {} });

  it('follows and unfollows users on behalf of the authenticated user', async () => {
    followService.follow.mockResolvedValue({ ok: true });
    await controller.follow(2, makeReq(1));
    expect(followService.follow).toHaveBeenCalledWith(1, 2);

    followService.unfollow.mockResolvedValue({ ok: true });
    await controller.unfollow(3, makeReq(1));
    expect(followService.unfollow).toHaveBeenCalledWith(1, 3);
  });

  it('throws Unauthorized when no user is attached to the request', async () => {
    await expect(controller.follow(2, makeReq())).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    await expect(controller.unfollow(2, makeReq())).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    await expect(
      controller.listFollowing({} as FollowingQueryDto, makeReq()),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('lists following users using the query dto', async () => {
    const dto = { q: 'art', skip: 10, take: 5 } as FollowingQueryDto;
    followService.listFollowing.mockResolvedValue([]);
    await controller.listFollowing(dto, makeReq(7));

    expect(followService.listFollowing).toHaveBeenCalledWith(7, 'art', 10, 5);
  });

  it('returns following ids without extra DTOs', async () => {
    followService.followingIds.mockResolvedValue([1, 2]);
    await controller.followingIds(makeReq(9));
    expect(followService.followingIds).toHaveBeenCalledWith(9);
  });
});
