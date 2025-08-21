import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import * as argon from 'argon2';
import { AuthDto, SignupDto } from '../../src/dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserService } from 'src/users/user.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private readonly users: UserService,
  ) {}

  async signup(dto: SignupDto) {
    // generate the password
    const hash = await argon.hash(dto.password);
    // save the new user in db
    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          hash,
          fullName: dto.fullName,
          username: dto.username,
          profile: {
            create: {
              avatarUrl: null, // optional
            },
          },
        },
      });

      // send back the jwt token
      return this.signToken(user.id, user.email);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException('Credentials taken');
        }
      }
      throw error;
    }
  }
  async signin(dto: AuthDto) {
    // find user by email
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: {
        id: true,
        email: true,
        hash: true, // your password field
        tokenVersion: true, // added field
      },
    });
    if (!user) throw new ForbiddenException('Credentials incorrect');

    const ok = await argon.verify(user.hash, dto.password);
    if (!ok) throw new ForbiddenException('Credentials incorrect');

    const accessToken = this.signToken(user.id, user.email);
    const refreshToken = await this.signRefreshToken(
      user.id,
      user.tokenVersion,
    );

    return { accessToken, refreshToken };
  }

  async signToken(
    userId: number,
    email: string,
  ): Promise<{ access_token: string }> {
    const payload = {
      sub: userId,
      email,
    };
    const token = await this.jwt.signAsync(payload, {
      expiresIn: '24h',
      secret: this.config.get('JWT_SECRET'),
    });

    return {
      access_token: token,
    };
  }

  async signRefreshToken(userId: number, tokenVersion?: number) {
    // If tokenVersion wasn't selected above for some reason, fetch it
    const tv =
      tokenVersion ??
      (await this.prisma.user.findUnique({
        where: { id: userId },
        select: { tokenVersion: true },
      }))!.tokenVersion;

    // include "tv" so you can invalidate by bumping tokenVersion on password change
    return this.jwt.sign(
      { sub: userId, tv },
      { secret: this.config.get('JWT_REFRESH_SECRET'), expiresIn: '30d' },
    );
  }

  async changePassword(userId: number, current: string, next: string) {
    if (current === next) {
      throw new BadRequestException('New password must differ from current.');
    }

    const user = await this.users.findByIdWithPasswordHash(userId);
    if (!user) throw new BadRequestException('User not found.');

    const ok = await argon.verify(user.hash, current);
    if (!ok) throw new BadRequestException('Current password is incorrect.');

    const newHash = await argon.hash(next);

    await this.users.updatePasswordAfterChange(userId, newHash);

    // TODO (nice-to-have): emit audit event, revoke sessions, log IP/device
    return { success: true };
  }
}
