import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { User } from '@prisma/client';

@Module({
  imports: [],
  // providers: [UserService],
  controllers: [UserController],
  // exports: [UserService], // Export UsersService for use in AuthModule
})
export class UserModule {}
