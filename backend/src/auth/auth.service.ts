import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  private readonly secretKey = 'J7RKx6EAkTC7lLPiSR92cd9Q/uVCUXAJ'; // Replace with a strong secret key

  signToken(userId: number, username: string) {
    const payload = { userId, username };
    return {
      access_token: jwt.sign(payload, this.secretKey, { expiresIn: '1h' }),
    };
  }
}
