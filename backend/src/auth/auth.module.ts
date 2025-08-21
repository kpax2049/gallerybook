import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { UserModule } from '../users/user.module';
import { AuthController } from './auth.controller';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategy';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserService } from 'src/users/user.service';
import { ThrottlerModule, seconds } from '@nestjs/throttler';

@Module({
  imports: [
    PrismaModule,
    UserModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
    ThrottlerModule.forRoot({
      throttlers: [
        { ttl: seconds(60), limit: 5 }, // 5 requests / minute
      ],
    }),
  ],
  providers: [
    ConfigService,
    JwtStrategy,
    AuthService,
    PrismaService,
    UserService,
  ],
  exports: [AuthService],
  controllers: [AuthController], // Export AuthService for use in other modules
})
export class AuthModule {}
