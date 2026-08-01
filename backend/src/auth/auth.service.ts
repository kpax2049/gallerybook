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
import { UserStatus } from '@prisma/client';

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
      await this.prisma.user.create({
        data: {
          email: dto.email,
          hash,
          fullName: dto.fullName,
          username: dto.username,
          status: UserStatus.inactive,
          profile: {
            create: {
              avatarUrl: null, // optional
            },
          },
        },
      });

      return { status: 'pending' as const };
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
        status: true,
      },
    });
    if (!user) throw new ForbiddenException('Credentials incorrect');

    const ok = await argon.verify(user.hash, dto.password);
    if (!ok) throw new ForbiddenException('Credentials incorrect');

    if (user.status !== UserStatus.active) {
      return { status: 'pending' as const };
    }

    const accessToken = await this.signToken(
      user.id,
      user.email,
      user.tokenVersion,
    );
    const refreshToken = await this.signRefreshToken(
      user.id,
      user.tokenVersion,
    );

    return { status: 'active' as const, accessToken, refreshToken };
  }

  async signToken(
    userId: number,
    email: string,
    tokenVersion?: number,
  ): Promise<string> {
    const tv = await this.resolveTokenVersion(userId, tokenVersion);
    const payload = {
      sub: userId,
      email,
      tv,
    };
    const token = await this.jwt.signAsync(payload, {
      expiresIn: '24h',
      secret: this.getRequiredConfig('JWT_SECRET'),
    });

    return token;
  }

  async signRefreshToken(userId: number, tokenVersion?: number) {
    const tv = await this.resolveTokenVersion(userId, tokenVersion);

    // The same version claim invalidates both access and refresh tokens.
    return this.jwt.sign(
      { sub: userId, tv },
      {
        secret: this.getRequiredConfig('JWT_REFRESH_SECRET'),
        expiresIn: '30d',
      },
    );
  }

  private getRequiredConfig(key: string): string {
    if (typeof this.config.getOrThrow === 'function') {
      return this.config.getOrThrow<string>(key);
    }

    const value = this.config.get<string>(key);
    if (!value) {
      throw new Error(`${key} is required`);
    }
    return value;
  }

  private async resolveTokenVersion(
    userId: number,
    tokenVersion?: number,
  ): Promise<number> {
    if (tokenVersion !== undefined) return tokenVersion;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { tokenVersion: true },
    });
    if (!user) throw new ForbiddenException('User not found');
    return user.tokenVersion;
  }

  async changePassword(userId: number, current: string, next: string) {
    if (current === next) {
      throw new BadRequestException('New password must differ from current.');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, hash: true },
    });
    if (!user) throw new BadRequestException('User not found.');

    const ok = await argon.verify(user.hash, current);
    if (!ok) throw new BadRequestException('Current password is incorrect.');

    const newHash = await argon.hash(next);

    const updated = await this.users.updatePasswordAfterChange(
      user.id,
      newHash,
    );

    // TODO (nice-to-have): emit an audit event and log IP/device metadata.
    return { success: true, tokenVersion: updated.tokenVersion };
  }

  async verifyCurrentPassword(
    userId: number,
    currentPassword: string,
  ): Promise<boolean> {
    // Only minimal data needed
    const user = await this.users.findByIdWithPasswordHash(userId);
    if (!user?.hash && !(user as any)?.hash) return false;
    const hash = (user as any).hash ?? (user as any).hash;
    try {
      return await argon.verify(hash, currentPassword);
    } catch {
      return false;
    }
  }
}
