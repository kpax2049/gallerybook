import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
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

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.CREATED)
  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('signin')
  async signin(
    @Res({ passthrough: true }) res: Response,
    @Body() dto: AuthDto,
  ) {
    const { accessToken, refreshToken } = await this.authService.signin(dto);
    // Send refresh as HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'lax', // 'strict' if same-site only; 'none' + secure for cross-site
      secure: process.env.NODE_ENV === 'production',
      path: '/auth/refresh', // limit cookie to the refresh route
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30d
    });

    // Let Nest serialize the body you return
    return { accessToken };
  }

  @Post('signout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('refreshToken', { path: '/auth/refresh' });
    return { success: true };
  }

  @Patch('password')
  changePassword(@GetUser() user: User, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(
      user.id,
      dto.currentPassword,
      dto.newPassword,
    );
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
}
