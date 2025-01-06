import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
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
    try {
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
      where: {
        email: dto.email,
      },
    });
    // if user doesn't exist throw an exception
    if (!user) {
      throw new ForbiddenException('Credentials incorrect');
    }
    // copmare passwords
    const pwMatches = await argon.verify(user.hash, dto.password);
    // if password is incorrect throw an exception
    if (!pwMatches) {
      throw new ForbiddenException('Credentials incorrect');
    }
    // send back the user
    // strip out hash from return object
    // TODO: come up with better solution
    delete user.hash;
    return user;
  }
}
