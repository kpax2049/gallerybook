import { Controller, Post, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthService } from '../auth/auth.service';
import * as bcrypt from 'bcryptjs';
import { User } from './user.entity';

@Controller('users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private authService: AuthService,
  ) {}

  @Post('register')
  async register(
    @Body() userData: { username: string; password: string },
  ): Promise<User> {
    return this.usersService.create(userData.username, userData.password);
  }

  @Post('login')
  async login(@Body() userData: { username: string; password: string }) {
    const user = await this.usersService.findOneByUsername(userData.username);
    if (user && (await bcrypt.compare(userData.password, user.password))) {
      return this.authService.signToken(user.id, user.username);
    }
    throw new Error('Invalid credentials');
  }
}
