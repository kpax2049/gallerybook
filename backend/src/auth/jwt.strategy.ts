import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'J7RKx6EAkTC7lLPiSR92cd9Q/uVCUXAJ', // Replace with a strong secret key
    });
  }

  async validate(payload: any): Promise<any> {
    const user = await this.usersService.findOneByUsername(payload.username);
    if (user) {
      return { userId: payload.sub, username: payload.username };
    }
    throw new Error('Invalid token');
  }
}
