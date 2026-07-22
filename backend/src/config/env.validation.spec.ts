import { validateEnv } from './env.validation';

const coreConfig = {
  DATABASE_URL: 'postgresql://user:password@localhost:5432/gallerybook',
  JWT_SECRET: 'access-secret-at-least-16-chars',
  JWT_REFRESH_SECRET: 'refresh-secret-at-least-16-chars',
  COOKIE_SECRET: 'cookie-secret-at-least-16-chars',
};

const productionIntegrations = {
  AWS_REGION: 'us-east-1',
  AWS_ACCESS_KEY_ID: 'aws-access-key',
  AWS_SECRET_ACCESS_KEY: 'aws-secret-key',
  S3_BUCKET_NAME: 'gallerybook-images',
  CLOUDFRONT_DOMAIN: 'https://media.example.com',
  CLOUDINARY_CLOUD_NAME: 'gallerybook',
  CLOUDINARY_API_KEY: 'cloudinary-key',
  CLOUDINARY_API_SECRET: 'cloudinary-secret',
  GOOGLE_OAUTH_CLIENT_ID: 'google-client-id',
  GOOGLE_OAUTH_CLIENT_SECRET: 'google-client-secret',
  GITHUB_OAUTH_CLIENT_ID: 'github-client-id',
  GITHUB_OAUTH_CLIENT_SECRET: 'github-client-secret',
  TURNSTILE_SECRET_KEY: 'turnstile-secret',
};

describe('validateEnv', () => {
  it('allows integration settings to be omitted outside production', () => {
    expect(validateEnv(coreConfig)).toMatchObject({
      NODE_ENV: 'development',
      PORT: 3333,
      FRONTEND_URL: 'http://localhost:5173',
      BACKEND_URL: 'http://localhost:3333',
    });
  });

  it('requires every runtime integration setting in production', () => {
    let error: Error | undefined;

    try {
      validateEnv({ ...coreConfig, NODE_ENV: 'production' });
    } catch (caught) {
      error = caught as Error;
    }

    expect(error).toBeInstanceOf(Error);
    for (const key of Object.keys(productionIntegrations)) {
      expect(error?.message).toContain(`${key} is required in production`);
    }
  });

  it('rejects blank production integration settings', () => {
    expect(() =>
      validateEnv({
        ...coreConfig,
        ...productionIntegrations,
        NODE_ENV: 'production',
        AWS_REGION: '   ',
      }),
    ).toThrow('AWS_REGION is required in production');
  });

  it('accepts complete production integration settings', () => {
    expect(
      validateEnv({
        ...coreConfig,
        ...productionIntegrations,
        NODE_ENV: 'production',
        GOOGLE_OAUTH_CALLBACK_URL:
          'https://api.example.com/auth/oauth/google/callback',
      }),
    ).toMatchObject({
      NODE_ENV: 'production',
      ...productionIntegrations,
    });
  });

  it('validates optional integration URLs when configured', () => {
    expect(() =>
      validateEnv({
        ...coreConfig,
        NODE_ENV: 'development',
        GITHUB_OAUTH_CALLBACK_URL: 'not-a-url',
      }),
    ).toThrow('GITHUB_OAUTH_CALLBACK_URL: Invalid URL');
  });
});
