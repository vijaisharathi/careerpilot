import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app';

describe('Auth Validation Middleware', () => {
  it('rejects registration with invalid email', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'John',
      email: 'not-an-email',
      password: 'validpassword123',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('APP_ERROR');
  });

  it('rejects registration with short password', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'John',
      email: 'john@example.com',
      password: '123',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects login with empty body', async () => {
    const res = await request(app).post('/api/auth/login').send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
