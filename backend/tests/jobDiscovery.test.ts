import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import m from 'mongoose';
import app from '../src/app';
import { User } from '../src/models/user.model';
import { StudentProfile } from '../src/models/studentProfile.model';
import { JobOpportunity } from '../src/models/jobOpportunity.model';
import { SavedJob } from '../src/models/savedJob.model';
import { jobSourceManager } from '../src/services/jobs/jobSource.service';
import { isValidHttpUrl } from '../src/utils/urlValidator';

const TEST_DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/career_pilot_ai_test';

describe('Job & Internship Discovery and Profile Matching Module', () => {
  let tokenUserA = '';
  let tokenUserB = '';
  let fullStackJobId = '';
  let datadogJobId = '';

  const studentA = {
    name: 'Rohan Mehra',
    email: 'rohan.mehra@jobstest.com',
    password: 'Password2026!',
    profile: {
      college: 'San Jose State University',
      degree: 'B.S.',
      department: 'Computer Science',
      graduationYear: 2026,
      skills: ['TypeScript', 'JavaScript (ES6+)', 'React.js', 'Node.js & Express', 'MongoDB & Mongoose'],
      targetRoles: ['Full-Stack Developer'],
    },
  };

  const studentB = {
    name: 'Priya Patel',
    email: 'priya.patel@jobstest.com',
    password: 'Password2026!',
    profile: {
      college: 'University of Texas, Austin',
      degree: 'B.S.',
      department: 'Data Science',
      graduationYear: 2027,
      skills: ['Python', 'SQL'],
      targetRoles: ['Data Analyst'],
    },
  };

  beforeAll(async () => {
    if (m.connection.readyState === 0) {
      await m.connect(TEST_DB_URI);
    }
    await User.deleteMany({ email: /@jobstest\.com$/ });
    await StudentProfile.deleteMany({ email: /@jobstest\.com$/ });
    await SavedJob.deleteMany({});
    await JobOpportunity.deleteMany({});

    // Seed test opportunities
    await jobSourceManager.seedIfEmpty();

    // Register Student A
    const resA = await request(app).post('/api/auth/register').send(studentA);
    tokenUserA = resA.body.data.tokens.accessToken;

    // Register Student B
    const resB = await request(app).post('/api/auth/register').send(studentB);
    tokenUserB = resB.body.data.tokens.accessToken;
  });

  afterAll(async () => {
    await User.deleteMany({ email: /@jobstest\.com$/ });
    await StudentProfile.deleteMany({ email: /@jobstest\.com$/ });
    await SavedJob.deleteMany({});
    await JobOpportunity.deleteMany({});
  });

  describe('1. URL Security & Sanitization', () => {
    it('Validates legitimate https URLs and rejects dangerous schemes or SSRF targets', () => {
      expect(isValidHttpUrl('https://stripe.com/jobs')).toBe(true);
      expect(isValidHttpUrl('http://careers.datadoghq.com/openings')).toBe(true);

      // Malicious schemes
      expect(isValidHttpUrl('javascript:alert(1)')).toBe(false);
      expect(isValidHttpUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
      expect(isValidHttpUrl('file:///etc/passwd')).toBe(false);

      // Cloud metadata SSRF targets
      expect(isValidHttpUrl('http://169.254.169.254/latest/meta-data/')).toBe(false);
      expect(isValidHttpUrl('http://localhost:5000/admin')).toBe(false);
      expect(isValidHttpUrl('http://127.0.0.1:27017')).toBe(false);
      expect(isValidHttpUrl('http://10.0.0.1/private')).toBe(false);
      expect(isValidHttpUrl('http://192.168.1.1/router')).toBe(false);
    });
  });

  describe('2. Opportunity Search, Filtering & Pagination', () => {
    it('GET /api/jobs returns active opportunities with pagination', async () => {
      const res = await request(app).get('/api/jobs?limit=5&page=1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const { opportunities, pagination } = res.body.data;

      expect(opportunities.length).toBeLessThanOrEqual(5);
      expect(pagination.page).toBe(1);
      expect(pagination.limit).toBe(5);
      expect(pagination.totalCount).toBeGreaterThan(5);
      expect(pagination.totalPages).toBeGreaterThan(1);
      expect(pagination.hasNextPage).toBe(true);

      // Store IDs for detail & matching tests
      const stripeJob = opportunities.find((j: any) => j.company === 'Stripe');
      if (stripeJob) fullStackJobId = stripeJob._id;

      // Ensure demo listings are clearly flagged as demo data
      expect(opportunities[0].dataSourceType).toBe('seed_demonstration');
      expect(opportunities[0].isVerifiedVacancy).toBe(false);
      expect(opportunities[0].demoDisclaimer).toContain('Demo / Seed Listing');
    });

    it('Filters opportunities by employmentType (Internship vs Full-time)', async () => {
      const resInternships = await request(app).get('/api/jobs?employmentType=Internship');
      expect(resInternships.status).toBe(200);
      const list = resInternships.body.data.opportunities;
      expect(list.length).toBeGreaterThan(0);
      for (const item of list) {
        expect(item.employmentType).toBe('Internship');
      }

      const datadog = list.find((j: any) => j.company === 'Datadog');
      if (datadog) datadogJobId = datadog._id;

      const resFulltime = await request(app).get('/api/jobs?employmentType=Full-time');
      expect(resFulltime.status).toBe(200);
      for (const item of resFulltime.body.data.opportunities) {
        expect(item.employmentType).toBe('Full-time');
      }
    });

    it('Filters opportunities by workMode (Remote vs Hybrid vs On-site)', async () => {
      const resRemote = await request(app).get('/api/jobs?workMode=Remote');
      expect(resRemote.status).toBe(200);
      const list = resRemote.body.data.opportunities;
      expect(list.length).toBeGreaterThan(0);
      for (const item of list) {
        expect(item.workMode).toBe('Remote');
      }
    });

    it('Searches opportunities by company or skill keyword', async () => {
      const res = await request(app).get('/api/jobs?q=Stripe');
      expect(res.status).toBe(200);
      const list = res.body.data.opportunities;
      expect(list.length).toBeGreaterThanOrEqual(1);
      expect(list[0].company).toBe('Stripe');
    });

    it('Excludes expired opportunities from public search by default', async () => {
      const res = await request(app).get('/api/jobs?q=Legacy+Corp');
      expect(res.status).toBe(200);
      const list = res.body.data.opportunities;
      expect(list).toHaveLength(0); // Legacy Corp is expired
    });
  });

  describe('3. Profile-Based Matching & Academic Eligibility', () => {
    it('Computes personalized skill-match score and separate eligibility for authenticated student', async () => {
      const res = await request(app)
        .get('/api/jobs')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      const list = res.body.data.opportunities;
      expect(list.length).toBeGreaterThan(0);

      // Student A has TypeScript, React, Node.js, Express, MongoDB
      // Stripe role requires TypeScript, React, Node.js, REST API, MongoDB
      const stripeJob = list.find((j: any) => j.company === 'Stripe');
      expect(stripeJob).toBeDefined();
      expect(stripeJob.match).toBeDefined();

      const match = stripeJob.match;
      expect(match.matchScore).toBeGreaterThanOrEqual(60);
      expect(['High Match', 'Moderate Match']).toContain(match.suitability);

      // Verified matched skills breakdown
      const matchedNames = match.matchedSkills.map((s: any) => s.name);
      expect(matchedNames).toContain('TypeScript');
      expect(matchedNames).toContain('React.js');

      // Separate academic eligibility breakdown
      expect(match.eligibility).toBeDefined();
      expect(match.eligibility.criteria.length).toBeGreaterThan(0);
      const degreeCriterion = match.eligibility.criteria.find(
        (c: any) => c.criterion === 'Degree Level'
      );
      expect(degreeCriterion.status).toBe('eligible');

      // Verify rule: unverified GPA or unverified field is marked unverified
      const gpaCriterion = match.eligibility.criteria.find((c: any) => c.criterion === 'Minimum GPA');
      if (gpaCriterion) {
        expect(['eligible', 'unverified']).toContain(gpaCriterion.status);
      }
    });

    it('GET /api/jobs/:idOrSlug returns detailed opportunity with match explanation', async () => {
      const res = await request(app)
        .get(`/api/jobs/stripe-fullstack-software-engineer-2026`)
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const job = res.body.data.job;

      expect(job.company).toBe('Stripe');
      expect(job.match).toBeDefined();
      expect(job.responsibilities.length).toBeGreaterThan(0);
      expect(job.isSaved).toBe(false);
    });

    it('GET /api/jobs/:idOrSlug returns 404 for non-existent slug', async () => {
      const res = await request(app).get('/api/jobs/non-existent-opportunity-slug-404');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('4. AI Requirement Insights & Skill Gap Explanation', () => {
    it('GET /api/jobs/:id/ai-insights returns tailored guidance', async () => {
      if (!fullStackJobId) {
        const stripe = await JobOpportunity.findOne({ company: 'Stripe' });
        fullStackJobId = stripe!._id.toString();
      }

      const res = await request(app)
        .get(`/api/jobs/${fullStackJobId}/ai-insights`)
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const insights = res.body.data.insights;

      expect(insights).toHaveProperty('roleSummary');
      expect(insights).toHaveProperty('gapBridgeTip');
      expect(insights).toHaveProperty('resumeOptimizationTip');
      expect(insights.roleSummary.length).toBeGreaterThan(10);
    });
  });

  describe('5. Saved Jobs Persistence & Cross-User Isolation', () => {
    it('GET /api/jobs/saved rejects unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/jobs/saved');
      expect(res.status).toBe(401);
    });

    it('POST /api/jobs/:id/save saves opportunity with notes for User A', async () => {
      if (!fullStackJobId) {
        const stripe = await JobOpportunity.findOne({ company: 'Stripe' });
        fullStackJobId = stripe!._id.toString();
      }

      const res = await request(app)
        .post(`/api/jobs/${fullStackJobId}/save`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ notes: 'Strong fit for my React/TypeScript stack.' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.saved.job.toString()).toBe(fullStackJobId);
    });

    it('Duplicate save of the same job updates notes without error', async () => {
      const res = await request(app)
        .post(`/api/jobs/${fullStackJobId}/save`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ notes: 'Updated notes: recruiter connects on LinkedIn.' });

      expect([200, 201]).toContain(res.status);
      const savedCount = await SavedJob.countDocuments({ job: fullStackJobId });
      expect(savedCount).toBe(1); // No duplicates!
    });

    it('GET /api/jobs/saved returns saved opportunities for User A', async () => {
      const res = await request(app)
        .get('/api/jobs/saved')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const list = res.body.data.savedJobs;
      expect(list.length).toBe(1);
      expect(list[0].jobDetails.company).toBe('Stripe');
      expect(list[0].jobDetails.isSaved).toBe(true);
    });

    it('Cross-User Isolation: User B cannot see User A saved jobs', async () => {
      const res = await request(app)
        .get('/api/jobs/saved')
        .set('Authorization', `Bearer ${tokenUserB}`);

      expect(res.status).toBe(200);
      const list = res.body.data.savedJobs;
      expect(list).toHaveLength(0); // User B has no saved jobs yet
    });

    it('Cross-User Isolation: User B cannot unsave User A saved job', async () => {
      const res = await request(app)
        .delete(`/api/jobs/${fullStackJobId}/save`)
        .set('Authorization', `Bearer ${tokenUserB}`);

      expect(res.status).toBe(404); // Job not saved in User B's profile
      expect(res.body.success).toBe(false);

      // Verify User A still has the job saved
      const doc = await SavedJob.findOne({ job: fullStackJobId });
      expect(doc).not.toBeNull();
    });

    it('DELETE /api/jobs/:id/save allows User A to unsave their own job', async () => {
      const res = await request(app)
        .delete(`/api/jobs/${fullStackJobId}/save`)
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const check = await SavedJob.findOne({ job: fullStackJobId });
      expect(check).toBeNull();
    });
  });
});
