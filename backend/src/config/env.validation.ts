import { z } from 'zod';

const optionalString = z.preprocess(
  (value) =>
    typeof value === 'string' && value.trim() === '' ? undefined : value,
  z.string().trim().min(1).optional(),
);

const optionalUrl = z.preprocess(
  (value) =>
    typeof value === 'string' && value.trim() === '' ? undefined : value,
  z.string().trim().url().optional(),
);

const productionIntegrationKeys = [
  'AWS_REGION',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'S3_BUCKET_NAME',
  'CLOUDFRONT_DOMAIN',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'GOOGLE_OAUTH_CLIENT_ID',
  'GOOGLE_OAUTH_CLIENT_SECRET',
  'GITHUB_OAUTH_CLIENT_ID',
  'GITHUB_OAUTH_CLIENT_SECRET',
  'TURNSTILE_SECRET_KEY',
] as const;

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
    PORT: z.coerce.number().int().positive().default(3333),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 chars'),
    JWT_REFRESH_SECRET: z
      .string()
      .min(16, 'JWT_REFRESH_SECRET must be at least 16 chars'),
    COOKIE_SECRET: z
      .string()
      .min(16, 'COOKIE_SECRET must be at least 16 chars'),
    FRONTEND_URL: z.string().url().default('http://localhost:5173'),
    BACKEND_URL: z.string().url().default('http://localhost:3333'),
    CORS_ORIGINS: z.string().optional(),
    AWS_REGION: optionalString,
    AWS_ACCESS_KEY_ID: optionalString,
    AWS_SECRET_ACCESS_KEY: optionalString,
    S3_BUCKET_NAME: optionalString,
    CLOUDFRONT_DOMAIN: optionalUrl,
    CLOUDINARY_CLOUD_NAME: optionalString,
    CLOUDINARY_API_KEY: optionalString,
    CLOUDINARY_API_SECRET: optionalString,
    GOOGLE_OAUTH_CLIENT_ID: optionalString,
    GOOGLE_OAUTH_CLIENT_SECRET: optionalString,
    GOOGLE_OAUTH_CALLBACK_URL: optionalUrl,
    GITHUB_OAUTH_CLIENT_ID: optionalString,
    GITHUB_OAUTH_CLIENT_SECRET: optionalString,
    GITHUB_OAUTH_CALLBACK_URL: optionalUrl,
    TURNSTILE_SECRET_KEY: optionalString,
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== 'production') return;

    for (const key of productionIntegrationKeys) {
      if (!env[key]) {
        ctx.addIssue({
          code: 'custom',
          path: [key],
          message: `${key} is required in production`,
        });
      }
    }
  })
  .passthrough();

export type AppEnv = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): AppEnv {
  const parsed = envSchema.safeParse(config);

  if (!parsed.success) {
    const errors = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ');
    throw new Error(`Invalid environment configuration: ${errors}`);
  }

  return parsed.data;
}

export function parseCorsOrigins(frontendUrl: string, corsOrigins?: string) {
  const defaults = [
    frontendUrl,
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
  ];

  const configured = corsOrigins
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return Array.from(new Set(configured?.length ? configured : defaults));
}
