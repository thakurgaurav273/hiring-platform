import { env } from './env';

export const databaseConfig = {
  url: env.DATABASE_URL,
};
export type DatabaseConfig = typeof databaseConfig;
