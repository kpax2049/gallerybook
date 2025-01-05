import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { UsersModule } from '../users/users.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: 'J7RKx6EAkTC7lLPiSR92cd9Q/uVCUXAJ', // Replace with a strong secret key
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [AuthService, JwtStrategy, PrismaService],
  exports: [AuthService],
  controllers: [AuthController], // Export AuthService for use in other modules
})
export class AuthModule {}
