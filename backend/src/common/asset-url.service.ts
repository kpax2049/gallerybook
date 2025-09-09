import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AssetUrlService {
  private readonly cdnBase: string;

  constructor(private config: ConfigService) {}

  /** Map an S3 key or S3 URL to your CloudFront URL. Returns input if no CDN configured. */
  thumbKeyToCdnUrl(
    key: string | null | undefined,
    params?: Record<string, string | number>,
  ): string | null {
    if (!key) return null;

    const cloudfrontDomain = this.config.get<string>('CLOUDFRONT_DOMAIN');
    const transformParams = this.config.get<string>(
      'THUMB_IMG_TRANSFORM_PARAMS',
    );

    // normalize key (no leading slash)
    const cleanKey = key.replace(/^\/+/, '');

    const url = new URL(`${cloudfrontDomain}/${cleanKey}`);

    // apply params override or env defaults
    if (params) {
      Object.entries(params).forEach(([k, v]) =>
        url.searchParams.set(k, String(v)),
      );
    } else if (transformParams) {
      transformParams.split('&').forEach((p) => {
        const [k, v = ''] = p.split('=');
        if (k) url.searchParams.set(k, v);
      });
    }

    return url.toString();
  }
}
