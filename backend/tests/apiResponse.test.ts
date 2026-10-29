import { describe, it, expect } from 'vitest';
import { Response } from 'express';
import { sendSuccess, sendError } from '../src/utils/apiResponse';

describe('API Response Formatter', () => {
  const createMockResponse = () => {
    const res: Partial<Response> = {};
    res.status = function (code: number) {
      this.statusCode = code;
      return this as Response;
    };
    res.json = function (body: unknown) {
      this.jsonBody = body;
      return this as Response;
    };
    return res as Response & { statusCode: number; jsonBody: Record<string, unknown> };
  };

  it('formats success response correctly', () => {
    const mockRes = createMockResponse();
    const payload = { userId: '123', name: 'John Doe' };

    sendSuccess(mockRes, payload, 'User fetched', 200);

    expect(mockRes.statusCode).toBe(200);
    expect(mockRes.jsonBody.success).toBe(true);
    expect(mockRes.jsonBody.message).toBe('User fetched');
    expect(mockRes.jsonBody.data).toEqual(payload);
    expect(mockRes.jsonBody.meta).toBeDefined();
  });

  it('formats error response correctly', () => {
    const mockRes = createMockResponse();

    sendError(mockRes, 'Validation failed', 400, { field: 'email' }, 'VALIDATION_ERROR');

    expect(mockRes.statusCode).toBe(400);
    expect(mockRes.jsonBody.success).toBe(false);
    expect(mockRes.jsonBody.message).toBe('Validation failed');
    expect((mockRes.jsonBody.error as { code: string }).code).toBe('VALIDATION_ERROR');
    expect(mockRes.jsonBody.meta).toBeDefined();
  });
});
