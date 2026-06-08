import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type TurnstileSiteverifyResponse = {
  success: boolean;
  'error-codes'?: string[];
};

@Injectable()
export class TurnstileService {
  private readonly siteverifyUrl =
    'https://challenges.cloudflare.com/turnstile/v0/siteverify';

  constructor(private readonly config: ConfigService) {}

  async verify(token?: string, remoteIp?: string) {
    const secret = this.config.get<string>('TURNSTILE_SECRET_KEY');
    const isProduction =
      this.config.get<string>('NODE_ENV') === 'production';

    if (!secret) {
      if (isProduction) {
        throw new InternalServerErrorException(
          'TURNSTILE_SECRET_KEY must be configured.',
        );
      }
      return;
    }

    if (!token) {
      throw new BadRequestException('Human verification is required.');
    }

    const body = new URLSearchParams({
      secret,
      response: token,
    });

    if (remoteIp) {
      body.set('remoteip', remoteIp);
    }

    let result: TurnstileSiteverifyResponse;
    try {
      const response = await fetch(this.siteverifyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      if (!response.ok) {
        throw new Error(`Turnstile siteverify failed: ${response.status}`);
      }

      result = (await response.json()) as TurnstileSiteverifyResponse;
    } catch {
      throw new BadRequestException('Human verification failed.');
    }

    if (!result.success) {
      throw new BadRequestException('Human verification failed.');
    }
  }
}
