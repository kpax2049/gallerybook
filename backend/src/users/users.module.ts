import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from '@prisma/client';

@Module({
  imports: [],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService], // Export UsersService for use in AuthModule
})
export class UsersModule {}
