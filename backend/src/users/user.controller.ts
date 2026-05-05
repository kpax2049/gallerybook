import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { Role, User } from '@prisma/client';
import { EditUserDto } from './dto';
import { UserService } from './user.service';
import { GetUser } from 'src/auth/decorator/get-user.decorator';
import { JwtGuard } from 'src/auth/guard/jwt.guard';

@UseGuards(JwtGuard)
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}
  @Get('me')
  getMe(@GetUser() user: User) {
    return this.userService.getUser(user.id);
  }

  @Get()
  getUsers(@GetUser() user: User) {
    this.requireAdmin(user);
    return this.userService.getUsers();
  }

  @Patch()
  editUser(@GetUser('id') userId: number, @Body() dto: EditUserDto) {
    return this.userService.editUser(userId, dto);
  }

  private requireAdmin(user: User) {
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Admin access required');
    }
  }
}
