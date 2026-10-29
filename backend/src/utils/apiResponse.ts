import { Response } from 'express';

export interface ApiResponseMeta {
  timestamp: string;
  requestId?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code?: string;
    details?: unknown;
  };
  meta: ApiResponseMeta;
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message: string = 'Operation successful',
  statusCode: number = 200,
  meta?: Partial<ApiResponseMeta>
): Response => {
  const payload: ApiResponse<T> = {
    success: true,
    message,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };

  return res.status(statusCode).json(payload);
};

export const sendCreated = <T>(
  res: Response,
  data: T,
  message: string = 'Resource created successfully',
  meta?: Partial<ApiResponseMeta>
): Response => {
  return sendSuccess(res, data, message, 201, meta);
};

export const sendError = (
  res: Response,
  message: string = 'An error occurred',
  statusCode: number = 500,
  errorDetails?: unknown,
  errorCode?: string
): Response => {
  const payload: ApiResponse<never> = {
    success: false,
    message,
    error: {
      code: errorCode || (statusCode >= 500 ? 'INTERNAL_SERVER_ERROR' : 'BAD_REQUEST'),
      details: errorDetails,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  };

  return res.status(statusCode).json(payload);
};
