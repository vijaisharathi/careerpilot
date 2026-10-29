import rateLimit from 'express-rate-limit';
import { env } from '../config/env';
import { sendError } from '../utils/apiResponse';

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === 'test' ? 1000 : 20, // max 20 login/register requests per window in prod/dev
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  handler: (_req, res) => {
    sendError(
      res,
      'Too many authentication requests from this IP. Please try again after 15 minutes.',
      429,
      undefined,
      'RATE_LIMIT_EXCEEDED'
    );
  },
  skip: () => env.NODE_ENV === 'test',
});

export const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === 'test' ? 1000 : 60, // max 60 AI generation / assistant queries per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(
      res,
      'AI request rate limit exceeded. Please wait a few moments before sending more queries.',
      429,
      undefined,
      'RATE_LIMIT_EXCEEDED'
    );
  },
  skip: () => env.NODE_ENV === 'test',
});

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === 'test' ? 5000 : 600, // max 600 general API requests per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(
      res,
      'Too many requests from this IP. Please try again later.',
      429,
      undefined,
      'RATE_LIMIT_EXCEEDED'
    );
  },
  skip: () => env.NODE_ENV === 'test',
});

export const codeExecutionRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: env.NODE_ENV === 'test' ? 1000 : 40, // 40 executions per 10 minutes
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(
      res,
      'Code execution rate limit exceeded. Please wait a few moments before running or submitting more code.',
      429,
      undefined,
      'RATE_LIMIT_EXCEEDED'
    );
  },
  skip: () => env.NODE_ENV === 'test',
});

