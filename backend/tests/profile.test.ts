import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import m from 'mongoose';
import app from '../src/app';
import { User } from '../src/models/user.model';
import { StudentProfile } from '../src/models/studentProfile.model';

const TEST_DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/career_pilot_ai_test';

describe('Student Profile & Portfolio API', () => {
  let tokenUserA = '';
  let tokenUserB = '';
  let skillIdA = '';
  let projectIdA = '';

  const userA = {
    name: 'Student Alice',
    email: 'alice@profiletest.com',
    password: 'Password123!',
  };

  const userB = {
    name: 'Student Bob',
    email: 'bob@profiletest.com',
    password: 'Password123!',
  };

  beforeAll(async () => {
    if (m.connection.readyState === 0) {
      await m.connect(TEST_DB_URI);
    }
    await User.deleteMany({ email: /@profiletest\.com$/ });
    await StudentProfile.deleteMany({ email: /@profiletest\.com$/ });

    // Register User A
    const resA = await request(app).post('/api/auth/register').send(userA);
    tokenUserA = resA.body.data.tokens.accessToken;

    // Register User B
    const resB = await request(app).post('/api/auth/register').send(userB);
    tokenUserB = resB.body.data.tokens.accessToken;
  });

  afterAll(async () => {
    await User.deleteMany({ email: /@profiletest\.com$/ });
    await StudentProfile.deleteMany({ email: /@profiletest\.com$/ });
    if (m.connection.readyState !== 0) {
      await m.disconnect();
    }
  });

  it('1. GET /api/profile/me returns current user profile', async () => {
    const res = await request(app)
      .get('/api/profile/me')
      .set('Authorization', `Bearer ${tokenUserA}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.profile.email).toBe(userA.email);
    expect(res.body.data.profile.fullName).toBe(userA.name);
  });

  it('2. PUT /api/profile/me updates student profile information', async () => {
    const res = await request(app)
      .put('/api/profile/me')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({
        college: 'MIT Institute of Technology',
        degree: 'Bachelor of Science',
        department: 'Computer Science',
        graduationYear: 2026,
        headline: 'Aspiring Cloud & Distributed Systems Engineer',
        careerInterests: {
          targetRoles: ['Backend Engineer', 'DevOps Engineer'],
          preferredLocations: ['San Francisco', 'Remote'],
          preferredMode: 'Remote',
          careerGoals: 'Build high-throughput distributed architectures.',
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.data.profile.college).toBe('MIT Institute of Technology');
    expect(res.body.data.profile.headline).toBe('Aspiring Cloud & Distributed Systems Engineer');
    expect(res.body.data.profile.careerInterests.preferredMode).toBe('Remote');
    expect(res.body.data.profile.completionPercentage).toBeGreaterThan(0);
  });

  it('3. POST /api/profile/skills adds technical skills to profile', async () => {
    const res = await request(app)
      .post('/api/profile/skills')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({
        name: 'Golang',
        category: 'languages',
        proficiency: 'Intermediate',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.skills.some((s: any) => s.name === 'Golang')).toBe(true);

    const added = res.body.data.skills.find((s: any) => s.name === 'Golang');
    skillIdA = added._id;

    // Check duplicate prevention
    const dupRes = await request(app)
      .post('/api/profile/skills')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({
        name: 'Golang',
        category: 'languages',
        proficiency: 'Advanced',
      });
    expect(dupRes.status).toBe(409);
  });

  it('4. PUT /api/profile/skills/:id updates skill proficiency', async () => {
    const res = await request(app)
      .put(`/api/profile/skills/${skillIdA}`)
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({
        proficiency: 'Advanced',
      });

    expect(res.status).toBe(200);
    const updated = res.body.data.skills.find((s: any) => s._id === skillIdA);
    expect(updated.proficiency).toBe('Advanced');
  });

  it('5. POST /api/profile/projects adds a project to student portfolio', async () => {
    const res = await request(app)
      .post('/api/profile/projects')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({
        title: 'Distributed Event Streaming Engine',
        technologies: ['Golang', 'Kafka', 'Docker'],
        link: 'https://github.com/alice/event-stream',
        bullets: ['Engineered high-throughput event processing pipeline.'],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.projects.length).toBeGreaterThan(0);
    projectIdA = res.body.data.projects[0]._id;
  });

  it('6. POST /api/profile/certifications adds a certification', async () => {
    const res = await request(app)
      .post('/api/profile/certifications')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({
        title: 'AWS Certified Cloud Practitioner',
        issuer: 'Amazon Web Services',
        issueDate: '2025-10',
        credentialUrl: 'https://aws.amazon.com/verification/12345',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.certifications.length).toBe(1);
    expect(res.body.data.certifications[0].title).toBe('AWS Certified Cloud Practitioner');
  });

  it('7. POST /api/profile/education adds education record', async () => {
    const res = await request(app)
      .post('/api/profile/education')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({
        institution: 'MIT',
        degree: 'B.S.',
        field: 'Computer Science',
        startDate: '2022',
        endDate: '2026',
        gpa: '3.9 / 4.0',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.educationHistory.length).toBe(1);
  });

  it('8. POST /api/profile/experience adds internship experience', async () => {
    const res = await request(app)
      .post('/api/profile/experience')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({
        role: 'Cloud Engineering Intern',
        company: 'Stripe',
        location: 'Remote',
        startDate: 'June 2025',
        endDate: 'August 2025',
        current: false,
        bullets: ['Optimized Redis cluster cache hit ratio.'],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.experience.length).toBe(1);
    expect(res.body.data.profile.completionPercentage).toBeGreaterThanOrEqual(50);
  });

  it('9. Cross-User Isolation: User B cannot delete User A\'s skill', async () => {
    const res = await request(app)
      .delete(`/api/profile/skills/${skillIdA}`)
      .set('Authorization', `Bearer ${tokenUserB}`);

    expect(res.status).toBe(404);
  });

  it('10. Cross-User Isolation: User B cannot update User A\'s project', async () => {
    const res = await request(app)
      .put(`/api/profile/projects/${projectIdA}`)
      .set('Authorization', `Bearer ${tokenUserB}`)
      .send({ title: 'Hacked Project' });

    expect(res.status).toBe(404);
  });

  it('11. User A can delete their own skill', async () => {
    const res = await request(app)
      .delete(`/api/profile/skills/${skillIdA}`)
      .set('Authorization', `Bearer ${tokenUserA}`);

    expect(res.status).toBe(200);
    expect(res.body.data.skills.some((s: any) => s._id === skillIdA)).toBe(false);
  });
});

