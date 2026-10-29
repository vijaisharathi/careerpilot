import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import m from 'mongoose';
import app from '../src/app';
import { User } from '../src/models/user.model';
import { StudentProfile } from '../src/models/studentProfile.model';
import { JobOpportunity } from '../src/models/jobOpportunity.model';
import { CareerRole } from '../src/models/careerRole.model';
import { LearningResource } from '../src/models/learningResource.model';
import { AuditLog } from '../src/models/auditLog.model';
import { PlatformSettings } from '../src/models/platformSettings.model';
import { signAccessToken } from '../src/utils/jwt';

const TEST_DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/career_pilot_ai_test';

describe('Phase 13: Admin Dashboard & Platform Management', () => {
  let adminToken = '';
  let adminUserId = '';
  let studentToken = '';
  let studentUserId = '';
  let createdJobId = '';
  let createdRoleId = '';
  let createdResourceId = '';

  const adminCredentials = {
    name: 'Super Admin',
    email: 'super.admin@admintest.com',
    password: 'AdminPassword2026!',
    role: 'admin' as const,
  };

  const studentCredentials = {
    name: 'College Student',
    email: 'student.applicant@admintest.com',
    password: 'StudentPassword2026!',
    role: 'student' as const,
  };

  beforeAll(async () => {
    if (m.connection.readyState === 0) {
      await m.connect(TEST_DB_URI);
    }

    // Clean up test users
    await User.deleteMany({ email: /@admintest\.com$/ });
    await AuditLog.deleteMany({ actorEmail: /@admintest\.com$/ });

    // 1. Provision Admin directly in DB
    const adminUser = new User({
      name: adminCredentials.name,
      email: adminCredentials.email,
      password: adminCredentials.password,
      role: 'admin',
      status: 'active',
      lastLoginAt: new Date(),
    });
    await adminUser.save();
    adminUserId = adminUser._id.toString();

    adminToken = signAccessToken({
      userId: adminUserId,
      email: adminUser.email,
      role: 'admin',
    });

    // 2. Register Student through standard registration
    const studentRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: studentCredentials.name,
        email: studentCredentials.email,
        password: studentCredentials.password,
        profile: {
          department: 'Computer Science',
          graduationYear: 2026,
          skills: ['TypeScript', 'Node.js'],
        },
      });

    expect(studentRes.status).toBe(201);
    studentToken = studentRes.body.data.tokens.accessToken;
    studentUserId = studentRes.body.data.user.id;
  });

  afterAll(async () => {
    await User.deleteMany({ email: /@admintest\.com$/ });
    await JobOpportunity.deleteMany({ company: 'AdminTest TechCorp' });
    await CareerRole.deleteMany({ slug: 'admin-test-ml-engineer' });
    await LearningResource.deleteMany({ title: /AdminTest/ });
    await AuditLog.deleteMany({ actorEmail: /@admintest\.com$/ });
  });

  // ==========================================
  // 1. RBAC & ROLE-BASED ACCESS CONTROL
  // ==========================================
  describe('1. Role-Based Access Control & Strict Role Separation', () => {
    it('blocks unauthenticated requests to admin endpoints with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/admin/overview');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('blocks student token from accessing admin endpoints with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/admin/overview')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Requires one of the following roles: admin');
    });

    it('rejects student self-promotion attempt during public registration', async () => {
      const selfPromoteRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Hacker Attempt',
          email: 'hacker.admin@admintest.com',
          password: 'Password2026!',
          role: 'admin', // Malicious attempt to register as admin
        });

      expect(selfPromoteRes.status).toBe(403);
      expect(selfPromoteRes.body.message).toContain('Direct public registration for administrative accounts is prohibited');
    });

    it('allows verified administrator token to access admin endpoints', async () => {
      const res = await request(app)
        .get('/api/admin/overview')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalStudents).toBeGreaterThanOrEqual(1);
    });
  });

  // ==========================================
  // 2. ADMIN DASHBOARD OVERVIEW METRICS
  // ==========================================
  describe('2. Real Admin Dashboard Overview Metrics', () => {
    it('returns calculated metrics directly from database records without fabrication', async () => {
      const res = await request(app)
        .get('/api/admin/overview')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const metrics = res.body.data;

      expect(typeof metrics.totalStudents).toBe('number');
      expect(typeof metrics.activeStudents).toBe('number');
      expect(typeof metrics.suspendedStudents).toBe('number');
      expect(typeof metrics.totalJobs).toBe('number');
      expect(typeof metrics.totalInternships).toBe('number');
      expect(typeof metrics.careerAnalysesCompleted).toBe('number');
      expect(typeof metrics.roadmapsGenerated).toBe('number');
      expect(typeof metrics.mockInterviewsCompleted).toBe('number');
      expect(metrics.systemHealth).toBeDefined();
      expect(metrics.systemHealth.status).toBe('healthy');
      expect(Array.isArray(metrics.recentActivities)).toBe(true);
    });
  });

  // ==========================================
  // 3. STUDENT MANAGEMENT & SUSPENSION
  // ==========================================
  describe('3. Student Management & Security Boundary', () => {
    it('retrieves paginated student list with safe projections only', async () => {
      const res = await request(app)
        .get('/api/admin/students?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.students)).toBe(true);
      expect(res.body.data.pagination).toBeDefined();

      const studentItem = res.body.data.students.find(
        (s: { email: string }) => s.email === studentCredentials.email
      );
      expect(studentItem).toBeDefined();
      expect(studentItem.name).toBe(studentCredentials.name);
      expect(studentItem.status).toBe('active');

      // Crucial Security Verification: No password hashes or refresh tokens leaked!
      expect(studentItem.password).toBeUndefined();
      expect(studentItem.refreshTokens).toBeUndefined();
    });

    it('searches students by name or email query', async () => {
      const res = await request(app)
        .get(`/api/admin/students?search=${studentCredentials.name}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.students.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.students[0].name).toBe(studentCredentials.name);
    });

    it('retrieves student detail summary with placement and roadmap metrics', async () => {
      const res = await request(app)
        .get(`/api/admin/students/${studentUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(studentUserId);
      expect(res.body.data.email).toBe(studentCredentials.email);
      expect(res.body.data.placementTracker).toBeDefined();
      expect(res.body.data.mockInterviewSummary).toBeDefined();
    });

    it('prevents an administrator from suspending their own account', async () => {
      const selfSuspendRes = await request(app)
        .patch(`/api/admin/students/${adminUserId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'suspended', reason: 'Self testing' });

      expect(selfSuspendRes.status).toBe(400);
      expect(selfSuspendRes.body.message).toContain('You cannot modify the status of your own account');
    });

    it('suspends a student account and immediately blocks login and token access', async () => {
      // 1. Suspend student
      const suspendRes = await request(app)
        .patch(`/api/admin/students/${studentUserId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'suspended', reason: 'Academic integrity verification' });

      expect(suspendRes.status).toBe(200);
      expect(suspendRes.body.data.status).toBe('suspended');

      // 2. Verify suspended student token is rejected on authenticated routes
      const blockedApiRes = await request(app)
        .get('/api/profile/me')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(blockedApiRes.status).toBe(403);
      expect(blockedApiRes.body.message).toContain('account has been suspended');

      // 3. Verify student cannot log in while suspended
      const blockedLoginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: studentCredentials.email,
          password: studentCredentials.password,
        });

      expect(blockedLoginRes.status).toBe(403);
      expect(blockedLoginRes.body.message).toContain('account has been suspended');

      // 4. Reactivate student
      const reactivateRes = await request(app)
        .patch(`/api/admin/students/${studentUserId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'active', reason: 'Verification complete' });

      expect(reactivateRes.status).toBe(200);
      expect(reactivateRes.body.data.status).toBe('active');
    });

    it('provisions a new administrator through authenticated admin endpoint', async () => {
      const newAdminEmail = 'secondary.admin@admintest.com';
      const provisionRes = await request(app)
        .post('/api/admin/users/provision-admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Secondary Admin',
          email: newAdminEmail,
          password: 'SecureAdminPass2026!',
        });

      expect(provisionRes.status).toBe(201);
      expect(provisionRes.body.data.role).toBe('admin');
      expect(provisionRes.body.data.email).toBe(newAdminEmail);

      // Verify new admin can log in and obtain admin token
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: newAdminEmail,
          password: 'SecureAdminPass2026!',
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.data.user.role).toBe('admin');
    });
  });

  // ==========================================
  // 4. JOB AND INTERNSHIP MANAGEMENT CRUD
  // ==========================================
  describe('4. Job & Internship Management CRUD', () => {
    it('creates a new verified job listing with URL validation', async () => {
      const jobPayload = {
        title: 'Senior Distributed Systems Engineer',
        company: 'AdminTest TechCorp',
        description:
          'Design and maintain high-throughput microservices using TypeScript, Node.js, and Kubernetes.',
        roleCategory: 'Backend Developer',
        employmentType: 'Full-time',
        workMode: 'Remote',
        location: 'Bengaluru / Remote',
        compensation: {
          amount: '₹28,00,000 - ₹35,00,000',
          currency: 'INR',
          period: 'yearly',
        },
        experienceRequirements: {
          minYears: 2,
          level: 'Associate',
        },
        requiredSkills: [
          { name: 'TypeScript', minProficiency: 'Advanced', importance: 'critical', weight: 5 },
          { name: 'Node.js', minProficiency: 'Advanced', importance: 'critical', weight: 4 },
        ],
        applicationUrl: 'https://admintest-techcorp.example.com/apply/123',
        source: 'Campus Placement Cell',
        status: 'published',
        isVerifiedVacancy: true,
      };

      const res = await request(app)
        .post('/api/admin/jobs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(jobPayload);

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe(jobPayload.title);
      expect(res.body.data.slug).toBeDefined();
      expect(res.body.data.status).toBe('published');

      createdJobId = res.body.data._id;
    });

    it('rejects job creation with invalid external application URL protocol', async () => {
      const invalidUrlPayload = {
        title: 'Insecure Listing',
        company: 'AdminTest TechCorp',
        description: 'Testing malicious URL schemes.',
        roleCategory: 'Frontend Developer',
        employmentType: 'Full-time',
        workMode: 'Remote',
        location: 'Remote',
        compensation: { amount: '1000', currency: 'USD', period: 'monthly' },
        experienceRequirements: { minYears: 0, level: 'Entry-Level' },
        applicationUrl: 'javascript:alert(1)', // Malicious scheme
      };

      const res = await request(app)
        .post('/api/admin/jobs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidUrlPayload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('updates job details and transitions listing status', async () => {
      const updateRes = await request(app)
        .put(`/api/admin/jobs/${createdJobId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          location: 'Hyderabad, India (Hybrid)',
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.location).toBe('Hyderabad, India (Hybrid)');

      // Transition status to archived
      const statusRes = await request(app)
        .patch(`/api/admin/jobs/${createdJobId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'archived' });

      expect(statusRes.status).toBe(200);
      expect(statusRes.body.data.status).toBe('archived');
    });

    it('deletes job listing cleanly', async () => {
      const deleteRes = await request(app)
        .delete(`/api/admin/jobs/${createdJobId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(deleteRes.status).toBe(200);

      const verifyRes = await request(app)
        .get(`/api/admin/jobs/${createdJobId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(verifyRes.status).toBe(404);
    });
  });

  // ==========================================
  // 5. CAREER ROLE CATALOG MANAGEMENT
  // ==========================================
  describe('5. Canonical Career Role Catalog Management', () => {
    it('creates a custom career role in the canonical catalog', async () => {
      const rolePayload = {
        title: 'AdminTest ML Engineer',
        slug: 'admin-test-ml-engineer',
        category: 'Machine Learning & AI',
        description: 'Design and deploy deep learning pipelines, transformer models, and inference APIs.',
        averageSalary: { entry: '$110,000 - $140,000', mid: '$150,000 - $200,000', currency: 'USD' },
        marketDemand: 'Extremely High',
        growthOutlook: '+35% YoY',
        requiredSkills: [
          { name: 'Python', category: 'languages', minProficiency: 'Advanced', importance: 'critical', weight: 5 },
          { name: 'PyTorch', category: 'frameworks', minProficiency: 'Intermediate', importance: 'critical', weight: 4 },
        ],
        isActive: true,
      };

      const res = await request(app)
        .post('/api/admin/career-roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(rolePayload);

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe(rolePayload.title);
      expect(res.body.data.isActive).toBe(true);

      createdRoleId = res.body.data._id;
    });

    it('toggles career role active status', async () => {
      const toggleRes = await request(app)
        .patch(`/api/admin/career-roles/admin-test-ml-engineer/status`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(toggleRes.status).toBe(200);
      expect(toggleRes.body.data.isActive).toBe(false);

      // Verify that deactivated role is filtered out from student roles query
      const studentRolesRes = await request(app).get('/api/career/roles');
      expect(studentRolesRes.status).toBe(200);
      const studentRoles = studentRolesRes.body.data.roles;
      const foundInStudent = studentRoles.find(
        (r: { slug: string }) => r.slug === 'admin-test-ml-engineer'
      );
      expect(foundInStudent).toBeUndefined();
    });
  });

  // ==========================================
  // 6. LEARNING RESOURCE MANAGEMENT
  // ==========================================
  describe('6. Learning Resource Management', () => {
    it('creates a verified learning resource with metadata', async () => {
      const resourcePayload = {
        title: 'AdminTest Advanced React State Patterns',
        description: 'In-depth guide on state management, reducers, and context architecture.',
        topic: 'React',
        relatedSkill: 'react',
        resourceUrl: 'https://react.dev/learn/managing-state',
        resourceType: 'Official Documentation',
        difficulty: 'Advanced',
        estimatedDurationMinutes: 90,
        publicationStatus: 'published',
        isFree: true,
        provider: 'React Core Team',
        isVerified: true,
      };

      const res = await request(app)
        .post('/api/admin/learning-resources')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(resourcePayload);

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe(resourcePayload.title);
      expect(res.body.data.isVerified).toBe(true);
      expect(res.body.data.verificationDate).toBeDefined();

      createdResourceId = res.body.data._id;
    });

    it('updates learning resource difficulty and duration', async () => {
      const updateRes = await request(app)
        .put(`/api/admin/learning-resources/${createdResourceId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          difficulty: 'Intermediate',
          estimatedDurationMinutes: 120,
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.difficulty).toBe('Intermediate');
      expect(updateRes.body.data.estimatedDurationMinutes).toBe(120);
    });

    it('deletes learning resource cleanly', async () => {
      const deleteRes = await request(app)
        .delete(`/api/admin/learning-resources/${createdResourceId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(deleteRes.status).toBe(200);
    });
  });

  // ==========================================
  // 7. AI MONITORING & USAGE
  // ==========================================
  describe('7. AI Service Monitoring & Safety', () => {
    it('retrieves real-time AI provider metrics without exposing API keys or secrets', async () => {
      const res = await request(app)
        .get('/api/admin/ai/status')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const aiStats = res.body.data;

      expect(aiStats.provider).toBeDefined();
      expect(aiStats.model).toBeDefined();
      expect(typeof aiStats.isConfigured).toBe('boolean');
      expect(typeof aiStats.totalRequests).toBe('number');
      expect(typeof aiStats.averageLatencyMs).toBe('number');
      expect(['operational', 'degraded', 'failing']).toContain(aiStats.status);

      // Crucial Security Verification: No secret API keys exposed!
      expect(JSON.stringify(aiStats)).not.toContain('GEMINI_API_KEY');
      expect(JSON.stringify(aiStats)).not.toContain('OPENAI_API_KEY');
      expect(JSON.stringify(aiStats)).not.toContain('AIzaSy');
      expect(JSON.stringify(aiStats)).not.toContain('sk-');
    });
  });

  // ==========================================
  // 8. AUDIT LOGS & PLATFORM SETTINGS
  // ==========================================
  describe('8. Platform Activity Audit Logs & System Settings', () => {
    it('records and returns security-sensitive administrative operations', async () => {
      const res = await request(app)
        .get('/api/admin/audit-logs?limit=20')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.logs)).toBe(true);
      expect(res.body.data.logs.length).toBeGreaterThan(0);

      // Verify that audit log recorded student status change and job creation
      const eventTypes = res.body.data.logs.map((l: { eventType: string }) => l.eventType);
      expect(eventTypes).toContain('student_status_change');
      expect(eventTypes).toContain('job_created');
    });

    it('retrieves and updates platform settings maintaining an audit trail', async () => {
      const getRes = await request(app)
        .get('/api/admin/settings')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.data.platformName).toBeDefined();

      const updateRes = await request(app)
        .put('/api/admin/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          platformName: 'Career Pilot AI — Placement Hub',
          systemNotice: 'Scheduled campus placement drive starts next Monday.',
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.platformName).toBe('Career Pilot AI — Placement Hub');
      expect(updateRes.body.data.systemNotice).toContain('Scheduled campus placement drive');
    });
  });
});

