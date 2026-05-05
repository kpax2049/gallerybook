import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto, SignupDto } from 'src/dto';
import { ChangePasswordDto } from 'src/dto/change-password.dto';
import { GetUser } from './decorator';
import { User } from '@prisma/client';
import { Response } from 'express';
import { JwtRefreshGuard } from './guard/jwt-refresh.guard';
import { Throttle, ThrottlerGuard, seconds } from '@nestjs/throttler';
import { VerifyPasswordDto } from 'src/dto/verify-password.dto';
import { JwtGuard } from './guard';
import { OAuthProvider } from '@prisma/client';
import { OAuthService } from './oauth.service';
import { randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private oauthService: OAuthService,
    private config: ConfigService,
  ) {}

  @HttpCode(HttpStatus.CREATED)
  @Post('signup')
  async signup(@Body() dto: SignupDto) {
    const accessToken = await this.authService.signup(dto);
    return { success: true, accessToken };
  }

  @HttpCode(HttpStatus.OK)
  @Post('signin')
  async signin(
    @Res({ passthrough: true }) res: Response,
    @Body() dto: AuthDto,
  ) {
    const { accessToken, refreshToken } = await this.authService.signin(dto);
    // Send refresh as HTTP-only cookie
    if (refreshToken) {
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        sameSite: 'lax', // 'strict' if same-site only; 'none' + secure for cross-site
        secure: process.env.NODE_ENV === 'production',
        path: '/auth/refresh', // limit cookie to the refresh route
        maxAge: 1000 * 60 * 60 * 24 * 30, // 30d
      });
    }
    // Let Nest serialize the body you return
    return { accessToken };
  }

  @Post('signout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('refreshToken', { path: '/auth/refresh' });
    return { success: true };
  }

  @Get('oauth/google')
  async loginWithGoogle(@Res() res: Response) {
    return this.redirectToProvider(res, OAuthProvider.GOOGLE);
  }

  @Get('oauth/github')
  async loginWithGithub(@Res() res: Response) {
    return this.redirectToProvider(res, OAuthProvider.GITHUB);
  }

  @Get('oauth/google/callback')
  async googleCallback(
    @Req() req: Request,
    @Res() res: Response,
    @Query('code') code?: string,
    @Query('state') state?: string,
    @Query('error') error?: string,
  ) {
    return this.handleOAuthCallback(
      req,
      res,
      OAuthProvider.GOOGLE,
      code,
      state,
      error,
    );
  }

  @Get('oauth/github/callback')
  async githubCallback(
    @Req() req: Request,
    @Res() res: Response,
    @Query('code') code?: string,
    @Query('state') state?: string,
    @Query('error') error?: string,
  ) {
    return this.handleOAuthCallback(
      req,
      res,
      OAuthProvider.GITHUB,
      code,
      state,
      error,
    );
  }

  @Patch('password')
  @UseGuards(JwtGuard)
  async changePassword(@GetUser() user: User, @Body() dto: ChangePasswordDto) {
    await this.authService.changePassword(
      user.id,
      dto.currentPassword,
      dto.newPassword,
    );
    const accessToken = await this.authService.signToken(user.id, user.email);
    return { success: true, accessToken };
  }

  @Post('password/verify')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtGuard, ThrottlerGuard) // local guard for this route
  @Throttle({ default: { limit: 5, ttl: seconds(60) } })
  async verifyPassword(@GetUser() user: User, @Body() dto: VerifyPasswordDto) {
    const valid = await this.authService.verifyCurrentPassword(
      user.id,
      dto.currentPassword,
    );
    return { valid }; // always 200; { valid: false } if wrong
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard) // uses the refresh strategy below
  async refresh(
    @GetUser() user: User,
    @Res({ passthrough: true }) res: Response,
  ) {
    const access = this.authService.signToken(user.id, user.email);
    // (optional) rotate refresh token each time:
    const refresh = await this.authService.signRefreshToken(user.id);
    res.cookie('refreshToken', refresh, {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/auth/refresh',
      maxAge: 1000 * 60 * 60 * 24 * 30,
    });
    return { accessToken: access };
  }

  private redirectToProvider(res: Response, provider: OAuthProvider) {
    const state = randomBytes(32).toString('hex');
    const cookieName = this.oauthStateCookieName(provider);

    res.cookie(cookieName, state, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/auth/oauth',
      maxAge: 1000 * 60 * 10,
    });

    return res.redirect(this.oauthService.getAuthorizationUrl(provider, state));
  }

  private async handleOAuthCallback(
    req: Request,
    res: Response,
    provider: OAuthProvider,
    code?: string,
    state?: string,
    error?: string,
  ) {
    const cookieName = this.oauthStateCookieName(provider);
    const expectedState = (req as any).cookies?.[cookieName];

    res.clearCookie(cookieName, { path: '/auth/oauth' });

    if (error) {
      return res.redirect(this.oauthErrorRedirect(error));
    }

    if (!state || !expectedState || state !== expectedState) {
      return res.redirect(this.oauthErrorRedirect('invalid_state'));
    }

    try {
      const user = await this.oauthService.authenticate(provider, code);
      const accessToken = await this.authService.signToken(user.id, user.email);
      const refreshToken = await this.authService.signRefreshToken(
        user.id,
        user.tokenVersion,
      );

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/auth/refresh',
        maxAge: 1000 * 60 * 60 * 24 * 30,
      });

      return res.redirect(this.oauthSuccessRedirect(accessToken));
    } catch {
      return res.redirect(this.oauthErrorRedirect('oauth_failed'));
    }
  }

  private oauthStateCookieName(provider: OAuthProvider) {
    return `oauthState_${provider.toLowerCase()}`;
  }

  private oauthSuccessRedirect(accessToken: string) {
    const frontendUrl =
      this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';
    return `${frontendUrl}/auth/oauth/callback#accessToken=${encodeURIComponent(accessToken)}`;
  }

  private oauthErrorRedirect(error: string) {
    const frontendUrl =
      this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';
    return `${frontendUrl}/login?oauthError=${encodeURIComponent(error)}`;
  }
}
