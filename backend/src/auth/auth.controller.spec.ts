import { Test } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtGuard } from './guard';
import { JwtRefreshGuard } from './guard/jwt-refresh.guard';
import { ThrottlerGuard } from '@nestjs/throttler';

describe('AuthController', () => {
  let controller: AuthController;
  const authService = {
    signup: jest.fn(),
    signin: jest.fn(),
    signout: jest.fn(),
    changePassword: jest.fn(),
    signToken: jest.fn(),
    signRefreshToken: jest.fn(),
    verifyCurrentPassword: jest.fn(),
  } as Record<string, jest.Mock>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    })
      .overrideGuard(JwtGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(JwtRefreshGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(AuthController);
    Object.values(authService).forEach((mock) => mock.mockReset());
  });

  describe('signup', () => {
    it('returns success + access token', async () => {
      authService.signup.mockResolvedValue('token');

      await expect(controller.signup({} as any)).resolves.toEqual({
        success: true,
        accessToken: 'token',
      });
      expect(authService.signup).toHaveBeenCalled();
    });
  });

  describe('signin', () => {
    it('sets refresh cookie and returns access token', async () => {
      authService.signin.mockResolvedValue({
        accessToken: 'access',
        refreshToken: 'refresh',
      });
      const res = { cookie: jest.fn() } as any;

      await expect(controller.signin(res, { email: 'e', password: 'p' } as any))
        .resolves.toEqual({ accessToken: 'access' });

      expect(authService.signin).toHaveBeenCalledWith({ email: 'e', password: 'p' });
      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'refresh',
        expect.objectContaining({ httpOnly: true, path: '/auth/refresh' }),
      );
    });
  });

  describe('logout', () => {
    it('clears refresh cookie', () => {
      const res = { clearCookie: jest.fn() } as any;
      expect(controller.logout(res)).toEqual({ success: true });
      expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', {
        path: '/auth/refresh',
      });
    });
  });

  describe('changePassword', () => {
    it('delegates to service then returns new access token', async () => {
      authService.changePassword.mockResolvedValue({ success: true });
      authService.signToken.mockResolvedValue('newAccess');
      const user = { id: 1, email: 'u@example.com' } as any;

      await expect(
        controller.changePassword(user, { currentPassword: 'a', newPassword: 'b' } as any),
      ).resolves.toEqual({ success: true, accessToken: 'newAccess' });

      expect(authService.changePassword).toHaveBeenCalledWith(1, 'a', 'b');
      expect(authService.signToken).toHaveBeenCalledWith(1, 'u@example.com');
    });
  });

  describe('verifyPassword', () => {
    it('returns validity flag', async () => {
      authService.verifyCurrentPassword.mockResolvedValue(true);
      const user = { id: 2 } as any;

      await expect(
        controller.verifyPassword(user, { currentPassword: 'pw' } as any),
      ).resolves.toEqual({ valid: true });
      expect(authService.verifyCurrentPassword).toHaveBeenCalledWith(2, 'pw');
    });
  });

  describe('refresh', () => {
    it('issues new tokens and sets refresh cookie', async () => {
      authService.signToken.mockReturnValue('newAccess');
      authService.signRefreshToken.mockResolvedValue('newRefresh');
      const res = { cookie: jest.fn() } as any;
      const user = { id: 3, email: 'x@example.com' } as any;

      await expect(controller.refresh(user, res)).resolves.toEqual({
        accessToken: 'newAccess',
      });

      expect(authService.signToken).toHaveBeenCalledWith(3, 'x@example.com');
      expect(authService.signRefreshToken).toHaveBeenCalledWith(3);
      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'newRefresh',
        expect.objectContaining({ httpOnly: true, secure: true, path: '/auth/refresh' }),
      );
    });
  });
});
