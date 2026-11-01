import { env } from './env';

export const storageConfig = {
  provider: env.STORAGE_PROVIDER,
  local: {
    dir: env.LOCAL_STORAGE_DIR,
  },
  s3: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    region: env.AWS_REGION,
    bucket: env.S3_BUCKET_NAME,
  },
  r2: {
    bucket: env.CLOUDFLARE_R2_BUCKET_NAME,
    accountId: env.CLOUDFLARE_R2_ACCOUNT_ID,
    accessKeyId: env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
};
export type StorageConfig = typeof storageConfig;
