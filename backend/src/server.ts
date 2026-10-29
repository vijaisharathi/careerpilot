import app from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { logger } from './utils/logger';
import { codingAssessmentService } from './services/codingAssessment.service';

const startServer = async () => {
  try {
    // Attempt database connection
    await connectDatabase();

    // Ensure initial coding assessments and questions are seeded if empty
    codingAssessmentService.seedInitialAssessmentsIfEmpty().catch((err) => {
      logger.warn('Failed to auto-seed initial coding assessments:', err);
    });

    const server = app.listen(env.PORT, () => {
      logger.info(`🚀 Career Pilot AI API Server running in [${env.NODE_ENV}] mode on port ${env.PORT}`);
      logger.info(`🔗 Health Check URL: http://localhost:${env.PORT}/api/health`);
      logger.info(`🤖 Active AI Provider: ${env.AI_PROVIDER}`);
    });

    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        logger.info('HTTP server closed');
        await disconnectDatabase();
        process.exit(0);
      });

      // Force shutdown after 10 seconds timeout
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('unhandledRejection', (reason: unknown) => {
      logger.error('Unhandled Promise Rejection:', reason);
    });

    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
