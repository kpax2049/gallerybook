import { Injectable } from '@nestjs/common';
import * as argon from 'argon2';
import { AuthDto } from 'src/dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async signup(dto: AuthDto) {
    // generate the password
    const hash = await argon.hash(dto.password);
    // save the new user in db
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        hash,
      },
    });

    // strip out hash from return object
    // TODO: come up with better solution
    delete user.hash;
    // return saved user
    return user;
  }
  signin() {}
}
