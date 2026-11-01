import app from './app';
import { env } from './config/env';
import prisma from './database/prisma-client';
import logger from './shared/logger/logger';
import { registerTimelineListener } from './modules/timeline/events/timeline.listener';
import CronService from './modules/notifications/cron.service';

async function bootstrap() {
  try {
    logger.info('Connecting to PostgreSQL database...');
    await prisma.$connect();
    logger.info('Database connection successfully established.');

    // Register internal event listeners
    registerTimelineListener();
    CronService.init();

    const port = env.PORT;
    const server = app.listen(port, () => {
      logger.info(`Server is running on port ${port}`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await prisma.$disconnect();
        logger.info('Database disconnected. Process exiting.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to bootstrap application:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

bootstrap();
