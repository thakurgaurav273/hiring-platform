import { env } from './env';

export const emailConfig = {
  provider: env.EMAIL_PROVIDER,
  from: env.EMAIL_FROM,
  resend: {
    apiKey: env.RESEND_API_KEY,
  },
  smtp: {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
    secure: env.SMTP_SECURE,
  },
};
export type EmailConfig = typeof emailConfig;
