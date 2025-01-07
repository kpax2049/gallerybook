import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { UserModule } from '../users/user.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthController } from './auth.controller';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategy';

@Module({
  imports: [
    PrismaModule,
    UserModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
  ],
  providers: [ConfigService, JwtStrategy, AuthService, PrismaService],
  exports: [AuthService],
  controllers: [AuthController], // Export AuthService for use in other modules
})
export class AuthModule {}
