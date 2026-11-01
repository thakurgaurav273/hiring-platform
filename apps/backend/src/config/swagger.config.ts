import { env } from './env';

export const swaggerConfig = {
  title: 'Grovyn Talent ATS API',
  description: 'API Documentation for Grovyn Talent Internal Applicant Tracking System',
  version: '1.0.0',
  path: '/api-docs',
  port: env.PORT,
};
export type SwaggerConfig = typeof swaggerConfig;
