// auth/jwt-refresh.strategy.ts
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from 'src/users/user.service';
import { ConfigService } from '@nestjs/config';
import { UserStatus } from '@prisma/client';

function cookieExtractor(req: any) {
  return req?.cookies?.refreshToken ?? null;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    config: ConfigService,
    private readonly users: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
      secretOrKey: config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      ignoreExpiration: false,
    });
  }

  async validate(payload: { sub: number; tv?: number }) {
    const user = await this.users.getTokenVersion(payload.sub);
    if (!user || payload.tv !== user.tokenVersion) {
      throw new UnauthorizedException('Refresh token invalid.');
    }
    if (user.status !== UserStatus.active) {
      throw new ForbiddenException('User is pending approval.');
    }
    return user;
  }
}
