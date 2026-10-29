import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import m from 'mongoose';
import app from '../src/app';
import { User } from '../src/models/user.model';
import { JobApplication } from '../src/models/jobApplication.model';
import { JobOpportunity } from '../src/models/jobOpportunity.model';

const TEST_DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/career_pilot_ai_test';

describe('Application Tracker Module', () => {
  let tokenUserA = '';
  let tokenUserB = '';
  let sampleOpportunityId = '';
  let applicationAId = '';

  const studentA = {
    name: 'Rohan Sharma',
    email: 'rohan.sharma@applicationtest.com',
    password: 'Password2026!',
    role: 'student',
  };

  const studentB = {
    name: 'Priya Patel',
    email: 'priya.patel@applicationtest.com',
    password: 'Password2026!',
    role: 'student',
  };

  beforeAll(async () => {
    if (m.connection.readyState === 0) {
      await m.connect(TEST_DB_URI);
    }
    await User.deleteMany({ email: /@applicationtest\.com$/ });
    await JobApplication.deleteMany({});
    await JobOpportunity.deleteMany({ company: 'TestCorp Alpha' });

    // Register Student A
    const resA = await request(app).post('/api/auth/register').send(studentA);
    tokenUserA = resA.body.data.tokens.accessToken;

    // Register Student B
    const resB = await request(app).post('/api/auth/register').send(studentB);
    tokenUserB = resB.body.data.tokens.accessToken;

    // Create a mock JobOpportunity
    const opportunity = await JobOpportunity.create({
      title: 'Junior Cloud Architect',
      slug: 'testcorp-junior-cloud-architect',
      company: 'TestCorp Alpha',
      companyLogo: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea',
      location: 'Hyderabad, India',
      workMode: 'Hybrid',
      employmentType: 'Full-time',
      roleCategory: 'Cloud & DevOps',
      description: 'Design and deploy resilient multi-region cloud backends.',
      compensation: {
        amount: '12-15 LPA',
        currency: 'INR',
        period: 'yearly',
      },
      experienceRequirements: {
        minYears: 0,
        level: 'Entry-Level',
      },
      requiredSkills: [
        { name: 'AWS', minProficiency: 'Intermediate', importance: 'critical', weight: 4 },
        { name: 'Docker', minProficiency: 'Intermediate', importance: 'critical', weight: 4 },
      ],
      preferredSkills: ['Kubernetes', 'Go'],
      minimumQualifications: {
        minDegreeLevel: "Bachelor's",
        allowedMajors: ['Computer Science'],
      },
      responsibilities: ['Deploy cloud infrastructure'],
      applicationUrl: 'https://testcorp.example.com/apply/101',
      source: 'Direct Partner',
      dataSourceType: 'campus_partner',
      isVerifiedVacancy: true,
      publicationDate: new Date(),
      status: 'active',
    });
    sampleOpportunityId = opportunity._id.toString();
  });

  afterAll(async () => {
    await User.deleteMany({ email: /@applicationtest\.com$/ });
    await JobApplication.deleteMany({});
    await JobOpportunity.deleteMany({ company: 'TestCorp Alpha' });
    await m.disconnect();
  });

  // 1. Manual Application Creation & Validation
  describe('Application Creation & Validation', () => {
    it('creates an application manually with required fields and status history', async () => {
      const res = await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          company: 'Acme Systems',
          jobTitle: 'Frontend Engineer',
          status: 'Applied',
          appliedDate: new Date().toISOString(),
          location: 'Bangalore, India',
          workMode: 'Remote',
          employmentType: 'Full-time',
          notes: 'Referral through college alumnus.',
          applicationUrl: 'https://acme.example.com/jobs/fe',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.company).toBe('Acme Systems');
      expect(res.body.data.jobTitle).toBe('Frontend Engineer');
      expect(res.body.data.status).toBe('Applied');
      expect(res.body.data.statusHistory).toHaveLength(1);
      expect(res.body.data.statusHistory[0].status).toBe('Applied');

      applicationAId = res.body.data._id;
    });

    it('rejects manual application creation when company or jobTitle is missing', async () => {
      const res = await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          notes: 'No company provided',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('creates an application linked to an existing JobOpportunity and auto-fills fields', async () => {
      const res = await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          jobOpportunity: sampleOpportunityId,
          status: 'Applied',
          notes: 'Applied through Career Pilot Job Discovery portal.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.company).toBe('TestCorp Alpha');
      expect(res.body.data.jobTitle).toBe('Junior Cloud Architect');
      expect(res.body.data.location).toBe('Hyderabad, India');
      expect(res.body.data.workMode).toBe('Hybrid');
      expect(res.body.data.applicationUrl).toBe('https://testcorp.example.com/apply/101');
    });

    it('prevents duplicate active applications to the exact same opportunity', async () => {
      const res = await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          jobOpportunity: sampleOpportunityId,
          status: 'Applied',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already have an active application');
    });
  });

  // 2. Listing, Filtering, and Search
  describe('Listing, Search & Filtering', () => {
    beforeAll(async () => {
      // Add additional test records for filtering
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);

      await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          company: 'FinTech Dynamics',
          jobTitle: 'Backend Developer',
          status: 'Interview',
          interviewDate: tomorrow.toISOString(),
          location: 'Mumbai, India',
        });

      await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          company: 'Nova AI Labs',
          jobTitle: 'AI Research Intern',
          status: 'Assessment',
          followUpDate: pastDate.toISOString(),
          location: 'Pune, India',
        });

      await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          company: 'Legacy Software',
          jobTitle: 'QA Intern',
          status: 'Saved',
        });
    });

    it('lists all applications for the student', async () => {
      const res = await request(app)
        .get('/api/applications')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(4);
    });

    it('filters applications by status', async () => {
      const res = await request(app)
        .get('/api/applications?status=Interview')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.every((app: { status: string }) => app.status === 'Interview')).toBe(true);
    });

    it('searches applications by company name or role title', async () => {
      const res = await request(app)
        .get('/api/applications?search=FinTech')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].company).toBe('FinTech Dynamics');
    });

    it('sorts applications by company in ascending order', async () => {
      const res = await request(app)
        .get('/api/applications?sortBy=company&sortOrder=asc')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const companies = res.body.data.map((a: { company: string }) => a.company);
      const sorted = [...companies].sort();
      expect(companies).toEqual(sorted);
    });
  });

  // 3. Status Transitions, Updates, and History
  describe('Status Transitions and Detail Updates', () => {
    it('updates application status and logs transition history', async () => {
      const res = await request(app)
        .put(`/api/applications/${applicationAId}`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          status: 'Interview',
          notes: 'Received invite for Technical Round 1 with Team Lead.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('Interview');
      expect(res.body.data.statusHistory.length).toBe(2);
      expect(res.body.data.statusHistory[1].status).toBe('Interview');
      expect(res.body.data.statusHistory[1].notes).toContain('Technical Round 1');
    });

    it('updates application dates and location details', async () => {
      const interviewTime = new Date();
      interviewTime.setDate(interviewTime.getDate() + 3);

      const res = await request(app)
        .put(`/api/applications/${applicationAId}`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          interviewDate: interviewTime.toISOString(),
          location: 'Bangalore (Hybrid)',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.location).toBe('Bangalore (Hybrid)');
      expect(res.body.data.interviewDate).toBeDefined();
    });

    it('rejects update with an invalid status enum', async () => {
      const res = await request(app)
        .put(`/api/applications/${applicationAId}`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          status: 'PendingReviewInvalid',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // 4. Statistics, Upcoming Interviews, and Overdue Follow-ups
  describe('Application Statistics & Milestones', () => {
    it('computes accurate pipeline statistics, response rates, and milestones', async () => {
      const res = await request(app)
        .get('/api/applications/stats')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const stats = res.body.data;
      expect(stats.total).toBeGreaterThanOrEqual(4);
      expect(stats.activePipeline).toBeGreaterThanOrEqual(3); // Applied + Assessment + Interview
      expect(stats.responseRate).toBeGreaterThan(0);
      expect(stats.upcomingInterviews).toBeInstanceOf(Array);
      expect(stats.upcomingInterviews.length).toBeGreaterThanOrEqual(1);
      expect(stats.overdueFollowUps).toBeInstanceOf(Array);
      expect(stats.overdueFollowUps.length).toBeGreaterThanOrEqual(1);
      expect(stats.overdueFollowUps[0].company).toBe('Nova AI Labs');
    });
  });

  // 5. Cross-User Isolation & Authorization
  describe('Cross-User Authorization and Ownership Isolation', () => {
    it('prevents Student B from accessing Student A application', async () => {
      const res = await request(app)
        .get(`/api/applications/${applicationAId}`)
        .set('Authorization', `Bearer ${tokenUserB}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('not authorized');
    });

    it('prevents Student B from updating Student A application', async () => {
      const res = await request(app)
        .put(`/api/applications/${applicationAId}`)
        .set('Authorization', `Bearer ${tokenUserB}`)
        .send({
          status: 'Offer',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('prevents Student B from deleting Student A application', async () => {
      const res = await request(app)
        .delete(`/api/applications/${applicationAId}`)
        .set('Authorization', `Bearer ${tokenUserB}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  // 6. Deletion
  describe('Application Deletion', () => {
    it('allows Student A to delete their own application', async () => {
      const res = await request(app)
        .delete(`/api/applications/${applicationAId}`)
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify it no longer exists
      const verifyRes = await request(app)
        .get(`/api/applications/${applicationAId}`)
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(verifyRes.status).toBe(404);
    });
  });
});
