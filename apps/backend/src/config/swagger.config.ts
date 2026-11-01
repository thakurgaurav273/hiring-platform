import { env } from './env';

export const swaggerConfig = {
  title: 'Robin Talent ATS API',
  description: 'API documentation for the Robin Talent applicant tracking system (Robin Labs)',
  version: '1.0.0',
  path: '/api-docs',
  port: env.PORT,
};
export type SwaggerConfig = typeof swaggerConfig;
