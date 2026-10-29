import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app';

describe('Health Check API', () => {
  it('GET /api/health should return a valid health check payload', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('message', 'Health check passed');
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('service', 'Career Pilot AI API');
    expect(res.body.data).toHaveProperty('status');
    expect(res.body.data).toHaveProperty('database');
    expect(res.body.data).toHaveProperty('aiService');
    expect(res.body.data.aiService).toHaveProperty('provider');
    expect(res.body.meta).toHaveProperty('timestamp');
  });

  it('GET / should return root API welcome information', async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toContain('Career Pilot AI');
  });

  it('GET /api/unknown-endpoint should return 404 with standard error format', async () => {
    const res = await request(app).get('/api/non-existent-route-for-testing');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toHaveProperty('code');
  });
});
