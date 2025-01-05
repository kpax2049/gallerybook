import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { UsersModule } from './users/users.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { SampleModule } from './sample/sample.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [UsersModule, AuthModule, PrismaModule],
  // providers: [
  //   {
  //     provide: APP_GUARD,
  //     useClass: JwtAuthGuard,
  //   },
  // ],
})
export class AppModule {}
