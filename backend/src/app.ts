import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { apiRateLimiter } from './middleware/rateLimit.middleware';
import apiRoutes from './routes';
import { errorHandler } from './middleware/error.middleware';
import { notFoundHandler } from './middleware/notFound.middleware';
import { sendSuccess } from './utils/apiResponse';

export const createApp = (): Application => {
  const app = express();

  // Security Middlewares
  app.use(helmet());
  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Parsing Middlewares
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Logging Middleware (skip during automated test runs)
  if (env.NODE_ENV !== 'test') {
    app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
  }

  // Root welcome / metadata route
  app.get('/', (_req: Request, res: Response) => {
    sendSuccess(res, {
      name: 'Career Pilot AI — Backend API',
      version: '0.1.0',
      documentation: '/api/health',
      environment: env.NODE_ENV,
    }, 'Welcome to the Career Pilot AI API service');
  });

  // Main API Routes with general rate limiting
  app.use('/api', apiRateLimiter, apiRoutes);

  // 404 handler for undefined routes
  app.use(notFoundHandler);

  // Centralized Error Handling Middleware
  app.use(errorHandler);

  return app;
};

export default createApp();
