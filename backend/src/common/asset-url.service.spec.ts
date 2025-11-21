import { ConfigService } from '@nestjs/config';
import { AssetUrlService } from './asset-url.service';

describe('AssetUrlService', () => {
  const buildConfig = (values: Record<string, string | undefined>) =>
    ({
      get: jest.fn((key: string) => values[key]),
    }) as unknown as ConfigService;

  it('returns null when no key provided', () => {
    const service = new AssetUrlService(
      buildConfig({
        CLOUDFRONT_DOMAIN: 'https://cdn.example.com',
        THUMB_IMG_TRANSFORM_PARAMS: 'tr=w-200',
      }),
    );

    expect(service.thumbKeyToCdnUrl(null)).toBeNull();
    expect(service.thumbKeyToCdnUrl(undefined)).toBeNull();
  });

  it('builds the CDN URL trimming leading slashes and appending env params', () => {
    const service = new AssetUrlService(
      buildConfig({
        CLOUDFRONT_DOMAIN: 'https://cdn.example.com',
        THUMB_IMG_TRANSFORM_PARAMS: 'tr=w-200&fit=cover',
      }),
    );

    expect(service.thumbKeyToCdnUrl('/uploads/pic.jpg')).toBe(
      'https://cdn.example.com/uploads/pic.jpg?tr=w-200&fit=cover',
    );
  });

  it('prefers params argument over env defaults', () => {
    const service = new AssetUrlService(
      buildConfig({
        CLOUDFRONT_DOMAIN: 'https://cdn.example.com',
        THUMB_IMG_TRANSFORM_PARAMS: 'tr=w-200',
      }),
    );

    expect(
      service.thumbKeyToCdnUrl('uploads/foo.png', { w: 100, h: 200 }),
    ).toBe('https://cdn.example.com/uploads/foo.png?w=100&h=200');
  });
});
