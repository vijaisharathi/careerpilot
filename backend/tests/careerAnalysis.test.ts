import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import m from 'mongoose';
import app from '../src/app';
import { User } from '../src/models/user.model';
import { StudentProfile } from '../src/models/studentProfile.model';
import { CareerAnalysis } from '../src/models/careerAnalysis.model';
import { CareerRole } from '../src/models/careerRole.model';
import { careerScoringService } from '../src/services/careerScoring.service';
import { CAREER_ROLES_CATALOG } from '../src/config/careerCatalog.data';

const TEST_DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/career_pilot_ai_test';

describe('AI Career Analysis & Skill Gap Module', () => {
  let tokenUserA = '';
  let tokenUserB = '';
  let analysisIdUserA = '';

  const studentA = {
    name: 'Devin Thorne',
    email: 'devin@careertest.com',
    password: 'Password2026!',
    profile: {
      college: 'Georgia Tech',
      degree: 'B.S.',
      department: 'Computer Science',
      graduationYear: 2027,
      skills: ['TypeScript', 'JavaScript (ES6+)', 'React.js', 'Node.js & Express'],
      targetRoles: ['Full-Stack Developer'],
    },
  };

  const studentB = {
    name: 'Nadia Vance',
    email: 'nadia@careertest.com',
    password: 'Password2026!',
    profile: {
      college: 'UC Berkeley',
      degree: 'B.S.',
      department: 'Data Science',
      graduationYear: 2026,
      skills: ['Python', 'SQL'],
      targetRoles: ['Data Analyst'],
    },
  };

  beforeAll(async () => {
    if (m.connection.readyState === 0) {
      await m.connect(TEST_DB_URI);
    }
    await User.deleteMany({ email: /@careertest\.com$/ });
    await StudentProfile.deleteMany({ email: /@careertest\.com$/ });
    await CareerAnalysis.deleteMany({});

    // Register Student A
    const resA = await request(app).post('/api/auth/register').send(studentA);
    tokenUserA = resA.body.data.tokens.accessToken;

    // Register Student B
    const resB = await request(app).post('/api/auth/register').send(studentB);
    tokenUserB = resB.body.data.tokens.accessToken;
  });

  afterAll(async () => {
    await User.deleteMany({ email: /@careertest\.com$/ });
    await StudentProfile.deleteMany({ email: /@careertest\.com$/ });
    await CareerAnalysis.deleteMany({});
    if (m.connection.readyState !== 0) {
      await m.disconnect();
    }
  });

  describe('1. Career Role Catalog API', () => {
    it('GET /api/career/roles returns all supported catalog career roles', async () => {
      const res = await request(app).get('/api/career/roles');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.roles.length).toBeGreaterThanOrEqual(12);

      const fullstack = res.body.data.roles.find((r: any) => r.slug === 'full-stack-developer');
      expect(fullstack).toBeDefined();
      expect(fullstack.requiredSkills.length).toBeGreaterThan(0);
      expect(fullstack.averageSalary).toHaveProperty('entry');
    });

    it('GET /api/career/roles/:slug retrieves specific role details', async () => {
      const res = await request(app).get('/api/career/roles/backend-developer');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.role.title).toBe('Backend Developer');
      expect(res.body.data.role.slug).toBe('backend-developer');
    });

    it('GET /api/career/roles/:slug returns 404 for unknown career role', async () => {
      const res = await request(app).get('/api/career/roles/non-existent-career-role');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('not found in catalog');
    });
  });

  describe('2. Deterministic Scoring Engine Unit Tests', () => {
    const fullstackRole = CAREER_ROLES_CATALOG.find((r) => r.slug === 'full-stack-developer')!;

    it('calculates deterministic skill match with partial credit for lower proficiency', () => {
      const studentSkills: any[] = [
        { name: 'TypeScript', proficiency: 'Beginner', category: 'languages', verified: true }, // lower than Intermediate
        { name: 'JavaScript (ES6+)', proficiency: 'Advanced', category: 'languages', verified: true }, // Met
      ];

      const result = careerScoringService.evaluateSkills(studentSkills, fullstackRole.requiredSkills);

      expect(result.skillMatchScore).toBeGreaterThan(0);
      expect(result.skillMatchScore).toBeLessThan(100);

      // Check partial credit
      const tsMatch = result.matchedSkills.find((s) => s.name === 'TypeScript');
      expect(tsMatch?.status).toBe('partial');
      expect(tsMatch?.creditPercentage).toBe(50); // Beginner (1) / Intermediate (2) = 50%

      // Check missing skills identification
      const missingMongo = result.missingSkills.find((s) => s.name === 'MongoDB & Mongoose');
      expect(missingMongo).toBeDefined();
      expect(missingMongo?.importance).toBe('critical');
    });

    it('awards 100% skill match when all required skills exceed or meet requirements', () => {
      const studentSkills: any[] = fullstackRole.requiredSkills.map((r) => ({
        name: r.name,
        category: r.category,
        proficiency: 'Advanced' as const,
        verified: true,
      }));

      const result = careerScoringService.evaluateSkills(studentSkills, fullstackRole.requiredSkills);
      expect(result.skillMatchScore).toBe(100);
      expect(result.missingSkills.length).toBe(0);
    });
  });

  describe('3. Career Analysis Workflow & AI Recommendations', () => {
    it('POST /api/career/analyze rejects incomplete profile with 0 skills', async () => {
      // Create empty student without skills
      const emptyUserRes = await request(app).post('/api/auth/register').send({
        name: 'Empty Student',
        email: 'empty@careertest.com',
        password: 'Password2026!',
      });
      const emptyToken = emptyUserRes.body.data.tokens.accessToken;

      const res = await request(app)
        .post('/api/career/analyze')
        .set('Authorization', `Bearer ${emptyToken}`)
        .send({ roleSlug: 'full-stack-developer' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Please add at least 1 technical skill');
    });

    it('POST /api/career/analyze generates deterministic scores and AI explanation', async () => {
      const res = await request(app)
        .post('/api/career/analyze')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ roleSlug: 'full-stack-developer' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      const analysis = res.body.data.analysis;
      expect(analysis).toHaveProperty('_id');
      analysisIdUserA = analysis._id;

      // Verify deterministic scores structure
      expect(analysis.scores).toHaveProperty('readinessScore');
      expect(analysis.scores).toHaveProperty('skillMatchScore');
      expect(analysis.scores).toHaveProperty('projectScore');
      expect(analysis.scores).toHaveProperty('suitabilityLevel');
      expect(['High Match', 'Moderate Match', 'Developing Match']).toContain(analysis.scores.suitabilityLevel);

      // Verify matched and missing skills
      expect(analysis.matchedSkills.length).toBeGreaterThan(0);
      expect(analysis.missingSkills.length).toBeGreaterThan(0);

      // Verify AI explanation components
      expect(analysis.aiExplanation).toHaveProperty('executiveSummary');
      expect(analysis.aiExplanation).toHaveProperty('strengthsNarrative');
      expect(analysis.aiExplanation).toHaveProperty('gapAnalysisNarrative');
      expect(analysis.aiExplanation.tailoredProjects.length).toBeGreaterThan(0);
      expect(analysis.aiExplanation.tailoredCertifications.length).toBeGreaterThan(0);
      expect(analysis.aiExplanation.actionPlan.length).toBeGreaterThanOrEqual(1);
      expect(analysis.aiExplanation).toHaveProperty('aiProvider');
    });

    it('GET /api/career/analysis/latest returns the most recent analysis', async () => {
      const res = await request(app)
        .get('/api/career/analysis/latest')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.analysis._id).toBe(analysisIdUserA);
      expect(res.body.data.analysis.isStale).toBe(false);
    });

    it('detects staleness when student profile is updated after analysis', async () => {
      // Add a new skill to student A's profile
      await request(app)
        .post('/api/profile/skills')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          name: 'Docker',
          category: 'cloud',
          proficiency: 'Intermediate',
        });

      // Fetch latest analysis: should now be flagged as stale
      const res = await request(app)
        .get('/api/career/analysis/latest')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.analysis.isStale).toBe(true);
    });

    it('GET /api/career/analysis/history returns past analyses for student', async () => {
      const res = await request(app)
        .get('/api/career/analysis/history')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.history)).toBe(true);
      expect(res.body.data.history.length).toBeGreaterThanOrEqual(1);
    });

    it('Cross-User Isolation: User B cannot access User A\'s analysis by ID (403 Forbidden)', async () => {
      const res = await request(app)
        .get(`/api/career/analysis/${analysisIdUserA}`)
        .set('Authorization', `Bearer ${tokenUserB}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('not authorized');
    });

    it('GET /api/career/analysis/latest rejects unauthenticated request (401)', async () => {
      const res = await request(app).get('/api/career/analysis/latest');
      expect(res.status).toBe(401);
    });
  });
});

