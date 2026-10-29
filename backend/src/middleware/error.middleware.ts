import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';
import { sendError } from '../utils/apiResponse';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'An unexpected server error occurred';
  let errorCode = 'INTERNAL_SERVER_ERROR';
  let details: unknown = undefined;

  // Handle known operational AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
    errorCode = statusCode >= 500 ? 'INTERNAL_SERVER_ERROR' : 'APP_ERROR';
  } else if (err.name === 'ValidationError') {
    // Mongoose Validation Error
    statusCode = 400;
    message = 'Validation failed';
    errorCode = 'VALIDATION_ERROR';
    details = (err as unknown as { errors?: Record<string, { message: string }> }).errors;
  } else if ((err as unknown as { code?: number }).code === 11000) {
    // Mongoose Duplicate Key Error
    statusCode = 409;
    message = 'Duplicate key error: A record with this unique value already exists';
    errorCode = 'DUPLICATE_KEY_ERROR';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
    errorCode = 'INVALID_TOKEN';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired';
    errorCode = 'TOKEN_EXPIRED';
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid identifier format';
    errorCode = 'INVALID_ID';
  }

  // Log error based on severity
  if (statusCode >= 500) {
    logger.error(`[Unhandled Error] ${err.message}`, {
      stack: err.stack,
      name: err.name,
    });
  } else {
    logger.warn(`[Client Error ${statusCode}] ${message}`, { details });
  }

  // In development, include stack trace for debugging if it's an unexpected internal error
  const errorPayload = {
    details,
    ...(env.NODE_ENV === 'development' && statusCode >= 500 ? { stack: err.stack } : {}),
  };

  sendError(res, message, statusCode, errorPayload, errorCode);
};
