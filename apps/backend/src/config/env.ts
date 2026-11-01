import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  API_PREFIX: z.string().default('/api/v1'),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(8),
  JWT_EXPIRY: z.string().default('15m'),
  REFRESH_TOKEN_SECRET: z.string().min(8),
  REFRESH_TOKEN_EXPIRY: z.string().default('7d'),
  STORAGE_PROVIDER: z.enum(['local', 's3', 'r2']).default('local'),
  LOCAL_STORAGE_DIR: z.string().default('./uploads'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().default('us-east-1'),
  S3_BUCKET_NAME: z.string().optional(),
  CLOUDFLARE_R2_BUCKET_NAME: z.string().optional(),
  CLOUDFLARE_R2_ACCOUNT_ID: z.string().optional(),
  CLOUDFLARE_R2_ACCESS_KEY_ID: z.string().optional(),
  CLOUDFLARE_R2_SECRET_ACCESS_KEY: z.string().optional(),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  EMAIL_PROVIDER: z.enum(['resend', 'smtp']).default('smtp'),
  EMAIL_FROM: z.string().default('Grovyn Talent <no-reply@grovyn.com>'),
  RESEND_API_KEY: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_SECURE: z.coerce.boolean().optional().default(false),
  // Rate limiting is on unless explicitly disabled. In development it is off
  // by default (see rateLimitEnabled below) so local work isn't throttled.
  RATE_LIMIT_ENABLED: z.preprocess((v) => (v === '' ? undefined : v), z.enum(['true', 'false']).optional()),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment configuration:');
  const errorMsg = JSON.stringify(parsed.error.format(), null, 2);
  console.error(errorMsg);
  throw new Error(`Invalid environment configuration: ${errorMsg}`);
}

export const env = parsed.data;

/** Production defaults to on; development and test default to off. */
export const rateLimitEnabled =
  env.RATE_LIMIT_ENABLED !== undefined ? env.RATE_LIMIT_ENABLED === 'true' : env.NODE_ENV === 'production';
export type EnvConfig = z.infer<typeof envSchema>;
