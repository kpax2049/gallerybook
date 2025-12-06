import { Test } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { JwtGuard } from 'src/auth/guard/jwt.guard';

describe('UserController', () => {
  let controller: UserController;
  const userService = {
    getUser: jest.fn(),
    getUsers: jest.fn(),
    editUser: jest.fn(),
  } as Record<string, jest.Mock>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: userService }],
    })
      .overrideGuard(JwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(UserController);
    Object.values(userService).forEach((mock) => mock.mockReset());
  });

  it('returns current user via getMe', async () => {
    userService.getUser.mockResolvedValue({ id: 1 });

    await expect(controller.getMe({ id: 1 } as any)).resolves.toEqual({
      id: 1,
    });
    expect(userService.getUser).toHaveBeenCalledWith(1);
  });

  it('returns all users via getUsers', async () => {
    userService.getUsers.mockResolvedValue([{ id: 1 }]);

    await controller.getUsers();
    expect(userService.getUsers).toHaveBeenCalled();
  });

  it('edits user with authenticated id', async () => {
    userService.editUser.mockResolvedValue({ id: 1, email: 'new@example.com' });

    await controller.editUser(1, { email: 'new@example.com' } as any);
    expect(userService.editUser).toHaveBeenCalledWith(1, {
      email: 'new@example.com',
    });
  });
});
