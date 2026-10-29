import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'express';
import m from 'mongoose';
import app from '../src/app';
import { User } from '../src/models/user.model';
import { StudentProfile } from '../src/models/studentProfile.model';

const TEST_DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/career_pilot_ai_test';

describe('Authentication Flow & Persistent Profiles API', () => {
  beforeAll(async () => {
    if (m.connection.readyState === 0) {
      await m.connect(TEST_DB_URI);
    }
    // Clean test collection
    await User.deleteMany({ email: /@authtest\.com$/ });
    await StudentProfile.deleteMany({ email: /@authtest\.com$/ });
  });

  afterAll(async () => {
    await User.deleteMany({ email: /@authtest\.com$/ });
    await StudentProfile.deleteMany({ email: /@authtest\.com$/ });
    if (m.connection.readyState !== 0) {
      await m.disconnect();
    }
  });

  const testUser = {
    name: 'Maya Lin',
    email: 'maya.lin@authtest.com',
    password: 'SecurePassword2026!',
    profile: {
      college: 'Stanford University',
      degree: 'B.S. in Computer Science',
      department: 'Engineering',
      graduationYear: 2027,
      skills: ['TypeScript', 'React.js'],
      targetRoles: ['Frontend Engineer'],
    },
  };

  let accessToken = '';
  let refreshToken = '';

  it('1. POST /api/auth/register successfully registers a new student', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
    expect(res.body.data.user.name).toBe(testUser.name);
    expect(res.body.data.tokens).toHaveProperty('accessToken');
    expect(res.body.data.tokens).toHaveProperty('refreshToken');

    // Ensure password is NEVER leaked in response
    expect(res.body.data.user).not.toHaveProperty('password');
    expect(res.body.data.user).not.toHaveProperty('refreshTokens');

    // Verify persistent StudentProfile was automatically created
    const profile = await StudentProfile.findOne({ email: testUser.email.toLowerCase() });
    expect(profile).not.toBeNull();
    expect(profile?.college).toBe('Stanford University');
    expect(profile?.completionPercentage).toBeGreaterThan(0);

    accessToken = res.body.data.tokens.accessToken;
    refreshToken = res.body.data.tokens.refreshToken;
  });

  it('2. Directly verifies password in MongoDB is hashed and never plaintext', async () => {
    const rawUser = await User.findOne({ email: testUser.email.toLowerCase() }).select('+password');
    expect(rawUser).not.toBeNull();
    expect(rawUser?.password).not.toBe(testUser.password);
    expect(rawUser?.password?.startsWith('$2')).toBe(true); // bcrypt hash
  });

  it('3. POST /api/auth/register prevents duplicate account registration (409 Conflict)', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('already exists');
  });

  it('4. POST /api/auth/login authenticates with valid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testUser.email,
      password: testUser.password,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tokens).toHaveProperty('accessToken');
    expect(res.body.data.tokens).toHaveProperty('refreshToken');

    accessToken = res.body.data.tokens.accessToken;
    refreshToken = res.body.data.tokens.refreshToken;
  });

  it('5. POST /api/auth/login rejects incorrect password (401 Unauthorized)', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testUser.email,
      password: 'WrongPassword!',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Invalid email or password');
  });

  it('6. POST /api/auth/refresh-token supports token rotation', async () => {
    const res = await request(app).post('/api/auth/refresh-token').send({
      refreshToken,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tokens).toHaveProperty('accessToken');
    expect(res.body.data.tokens).toHaveProperty('refreshToken');
    expect(res.body.data.tokens.refreshToken).not.toBe(refreshToken);

    const newAccessToken = res.body.data.tokens.accessToken;
    const newRefreshToken = res.body.data.tokens.refreshToken;

    // 7. Token reuse detection: presenting the previously consumed refresh token must fail
    const replayRes = await request(app).post('/api/auth/refresh-token').send({
      refreshToken, // old consumed token
    });

    expect(replayRes.status).toBe(401);

    // After reuse detection, all tokens for user should be invalidated
    accessToken = newAccessToken;
    refreshToken = newRefreshToken;
  });

  it('8. GET /api/auth/me returns current user info when authenticated', async () => {
    // Re-login to get fresh valid access token after revocation test
    const loginRes = await request(app).post('/api/auth/login').send({
      email: testUser.email,
      password: testUser.password,
    });
    accessToken = loginRes.body.data.tokens.accessToken;

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
    expect(res.body.data.profile.fullName).toBe(testUser.name);
  });

  it('9. GET /api/auth/me rejects requests without token or with invalid token (401)', async () => {
    const res1 = await request(app).get('/api/auth/me');
    expect(res1.status).toBe(401);

    const res2 = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid.token.payload');
    expect(res2.status).toBe(401);
  });
});
