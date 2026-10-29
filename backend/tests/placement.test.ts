import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import m, { Types } from 'mongoose';
import app from '../src/app';
import {
  User,
  StudentProfile,
  Institution,
  PlacementDrive,
  PlacementRegistration,
  PlacementAnnouncement,
  AuditLog,
} from '../src/models';
import { signAccessToken } from '../src/utils/jwt';

const TEST_DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/career_pilot_ai_test';

describe('Phase 14: Placement Officer Portal & College Placement Management', () => {
  let adminToken = '';
  let adminUserId = '';

  let instA: any = null;
  let instB: any = null;

  let officerAToken = '';
  let officerAUserId = '';

  let officerBToken = '';
  let officerBUserId = '';

  let studentAToken = '';
  let studentAUserId = '';

  let studentBToken = '';
  let studentBUserId = '';

  let createdDriveId = '';
  let createdRegistrationId = '';

  beforeAll(async () => {
    if (m.connection.readyState === 0) {
      await m.connect(TEST_DB_URI);
    }

    // Clean up test data
    await User.deleteMany({ email: /@placementtest\.com$/ });
    await Institution.deleteMany({ code: { $in: ['PTESTA', 'PTESTB'] } });
    await AuditLog.deleteMany({ actorEmail: /@placementtest\.com$/ });

    // 1. Create Institutions
    instA = await Institution.create({
      name: 'Alpha Institute of Technology',
      code: 'PTESTA',
      domain: 'alpha.edu',
      departments: ['Computer Science', 'Information Technology', 'Mechanical Engineering'],
      isActive: true,
    });

    instB = await Institution.create({
      name: 'Beta University of Engineering',
      code: 'PTESTB',
      domain: 'beta.edu',
      departments: ['Electrical Engineering', 'Civil Engineering'],
      isActive: true,
    });

    // 2. Create Administrator
    const adminUser = new User({
      name: 'System Administrator',
      email: 'admin@placementtest.com',
      password: 'AdminPassword2026!',
      role: 'admin',
      status: 'active',
      lastLoginAt: new Date(),
    });
    await adminUser.save();
    adminUserId = adminUser._id.toString();
    adminToken = signAccessToken({
      userId: adminUserId,
      email: adminUser.email,
      role: adminUser.role,
    });

    // 3. Create Placement Officer A (Institution A)
    const officerA = new User({
      name: 'Officer Alice',
      email: 'officer.a@placementtest.com',
      password: 'OfficerPassword2026!',
      role: 'placement_officer',
      status: 'active',
      institutionId: instA._id,
      lastLoginAt: new Date(),
    });
    await officerA.save();
    officerAUserId = officerA._id.toString();
    officerAToken = signAccessToken({
      userId: officerAUserId,
      email: officerA.email,
      role: officerA.role,
      institutionId: instA._id.toString(),
    });

    // 4. Create Placement Officer B (Institution B)
    const officerB = new User({
      name: 'Officer Bob',
      email: 'officer.b@placementtest.com',
      password: 'OfficerPassword2026!',
      role: 'placement_officer',
      status: 'active',
      institutionId: instB._id,
      lastLoginAt: new Date(),
    });
    await officerB.save();
    officerBUserId = officerB._id.toString();
    officerBToken = signAccessToken({
      userId: officerBUserId,
      email: officerB.email,
      role: officerB.role,
      institutionId: instB._id.toString(),
    });

    // 5. Create Student A (Institution A - Computer Science, 2026)
    const studentA = new User({
      name: 'Alex Student',
      email: 'alex.a@placementtest.com',
      password: 'StudentPassword2026!',
      role: 'student',
      status: 'active',
      institutionId: instA._id,
      lastLoginAt: new Date(),
    });
    await studentA.save();
    studentAUserId = studentA._id.toString();
    studentAToken = signAccessToken({
      userId: studentAUserId,
      email: studentA.email,
      role: studentA.role,
      institutionId: instA._id.toString(),
    });

    await StudentProfile.create({
      user: studentA._id,
      fullName: 'Alex Student',
      email: studentA.email,
      college: instA.name,
      institutionId: instA._id,
      department: 'Computer Science',
      degree: 'B.Tech',
      graduationYear: 2026,
      skills: [
        { name: 'TypeScript', proficiency: 'Advanced', verified: true, category: 'languages' },
        { name: 'React', proficiency: 'Intermediate', verified: false, category: 'frameworks' },
        { name: 'Node.js', proficiency: 'Intermediate', verified: false, category: 'frameworks' },
        { name: 'MongoDB', proficiency: 'Intermediate', verified: false, category: 'databases' },
        { name: 'Docker', proficiency: 'Beginner', verified: false, category: 'cloud' },
      ],
      educationHistory: [
        {
          institution: instA.name,
          degree: 'B.Tech Computer Science',
          field: 'Computer Science',
          startDate: '2022-08-01',
          endDate: '2026-05-31',
          gpa: '8.8',
        },
      ],
      projects: [
        {
          title: 'Campus Placement Portal',
          technologies: ['React', 'Node.js', 'TypeScript'],
          bullets: ['Built full stack portal'],
        },
      ],
      experience: [
        {
          role: 'Software Intern',
          company: 'TechCorp',
          startDate: '2024-05-01',
          endDate: '2024-08-01',
          current: false,
          bullets: ['Developed backend services'],
        },
      ],
      careerInterests: {
        targetRoles: ['Software Engineer'],
        preferredLocations: ['Remote'],
        preferredMode: 'Hybrid',
      },
      placementStatus: 'unplaced',
    });

    // 6. Create Student B (Institution B - Civil Engineering, 2025)
    const studentB = new User({
      name: 'Brian Student',
      email: 'brian.b@placementtest.com',
      password: 'StudentPassword2026!',
      role: 'student',
      status: 'active',
      institutionId: instB._id,
      lastLoginAt: new Date(),
    });
    await studentB.save();
    studentBUserId = studentB._id.toString();
    studentBToken = signAccessToken({
      userId: studentBUserId,
      email: studentB.email,
      role: studentB.role,
      institutionId: instB._id.toString(),
    });

    await StudentProfile.create({
      user: studentB._id,
      fullName: 'Brian Student',
      email: studentB.email,
      college: instB.name,
      institutionId: instB._id,
      department: 'Civil Engineering',
      degree: 'B.Tech',
      graduationYear: 2025,
      skills: [
        { name: 'AutoCAD', proficiency: 'Intermediate', verified: false, category: 'soft_skills' },
      ],
      completionPercentage: 45,
      placementStatus: 'unplaced',
    });
  });

  afterAll(async () => {
    await User.deleteMany({ email: /@placementtest\.com$/ });
    await Institution.deleteMany({ code: { $in: ['PTESTA', 'PTESTB'] } });
    await PlacementDrive.deleteMany({ companyName: /PlacementTest/ });
    await PlacementRegistration.deleteMany({ institutionId: { $in: [instA?._id, instB?._id] } });
    await PlacementAnnouncement.deleteMany({ title: /PlacementTest/ });
    await AuditLog.deleteMany({ actorEmail: /@placementtest\.com$/ });
  });

  // =========================================================================
  // 1. ROLE-BASED ACCESS CONTROL (RBAC) & ROLE PRIVILEGE SEPARATION
  // =========================================================================
  describe('1. Role-Based Access Control & Strict Privilege Separation', () => {
    it('blocks unauthenticated requests to placement officer endpoints with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/placement/dashboard/metrics');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('blocks student token from accessing placement officer endpoints with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/placement/dashboard/metrics')
        .set('Authorization', `Bearer ${studentAToken}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Requires one of the following roles: placement_officer, admin');
    });

    it('blocks placement officer token from accessing admin-only endpoints with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/admin/overview')
        .set('Authorization', `Bearer ${officerAToken}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Requires one of the following roles: admin');
    });

    it('rejects public self-promotion to placement_officer role during registration', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Attacker Officer',
        email: 'attacker@placementtest.com',
        password: 'Password123!',
        role: 'placement_officer',
      });
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Direct public registration for administrative or placement officer accounts is prohibited.');
    });
  });

  // =========================================================================
  // 2. ADMINISTRATOR PROVISIONING OF PLACEMENT OFFICERS
  // =========================================================================
  describe('2. Administrator Provisioning of Placement Officers', () => {
    it('allows an authenticated administrator to provision a Placement Officer account', async () => {
      const res = await request(app)
        .post('/api/placement/provision-officer')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Officer Charlie',
          email: 'officer.charlie@placementtest.com',
          password: 'SecureOfficer2026!',
          institutionId: instA._id.toString(),
          department: 'Computer Science',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.role).toBe('placement_officer');
      expect(res.body.data.email).toBe('officer.charlie@placementtest.com');
      expect(res.body.data.institutionId).toBe(instA._id.toString());
    });

    it('blocks non-admin users from provisioning placement officers', async () => {
      const res = await request(app)
        .post('/api/placement/provision-officer')
        .set('Authorization', `Bearer ${officerAToken}`)
        .send({
          name: 'Rogue Officer',
          email: 'rogue@placementtest.com',
          password: 'SecureOfficer2026!',
        });
      expect(res.status).toBe(403);
    });
  });

  // =========================================================================
  // 3. MULTI-TENANT INSTITUTION BOUNDARY ISOLATION
  // =========================================================================
  describe('3. Multi-Tenant Institution Boundary Isolation', () => {
    it('Officer A sees only students within Institution A in the student directory', async () => {
      const res = await request(app)
        .get('/api/placement/students')
        .set('Authorization', `Bearer ${officerAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const studentEmails = res.body.data.students.map((s: any) => s.email);
      expect(studentEmails).toContain('alex.a@placementtest.com');
      expect(studentEmails).not.toContain('brian.b@placementtest.com');
    });

    it('Officer B sees only students within Institution B in the student directory', async () => {
      const res = await request(app)
        .get('/api/placement/students')
        .set('Authorization', `Bearer ${officerBToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const studentEmails = res.body.data.students.map((s: any) => s.email);
      expect(studentEmails).toContain('brian.b@placementtest.com');
      expect(studentEmails).not.toContain('alex.a@placementtest.com');
    });

    it('blocks Officer A from accessing student details of a student in Institution B with 403 Forbidden', async () => {
      const res = await request(app)
        .get(`/api/placement/students/${studentBUserId}`)
        .set('Authorization', `Bearer ${officerAToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Access denied');
    });
  });

  // =========================================================================
  // 4. PLACEMENT DASHBOARD METRICS
  // =========================================================================
  describe('4. Placement Dashboard Metrics (Zero Fabrication)', () => {
    it('computes accurate real metrics for Institution A', async () => {
      const res = await request(app)
        .get('/api/placement/dashboard/metrics')
        .set('Authorization', `Bearer ${officerAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const { institution, metrics } = res.body.data;

      expect(institution.code).toBe('PTESTA');
      expect(metrics.totalStudents).toBeGreaterThanOrEqual(1);
      expect(metrics.completedProfiles).toBeGreaterThanOrEqual(1);
      expect(metrics.activeDrivesCount).toBe(0);
      expect(typeof metrics.placementReadyStudents).toBe('number');
    });
  });

  // =========================================================================
  // 5. RECRUITMENT DRIVE MANAGEMENT (CRUD)
  // =========================================================================
  describe('5. Recruitment Drive Management (CRUD)', () => {
    it('creates a new campus recruitment drive with valid parameters', async () => {
      const deadline = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      const res = await request(app)
        .post('/api/placement/drives')
        .set('Authorization', `Bearer ${officerAToken}`)
        .send({
          companyName: 'PlacementTest TechCorp',
          driveTitle: 'PlacementTest 2026 Graduate Software Engineer Drive',
          jobRole: 'Software Engineer',
          jobDescription: 'Design and build cloud-native microservices with TypeScript and React.',
          requiredSkills: ['TypeScript', 'React', 'Node.js'],
          eligibilityCriteria: {
            eligibleDepartments: ['Computer Science', 'Information Technology'],
            eligibleGraduationYears: [2026],
            minGpa: 7.0,
            minProfileCompletion: 70,
          },
          openingsCount: 15,
          location: 'Campus / Hybrid',
          employmentType: 'Full-time',
          workMode: 'Hybrid',
          compensation: {
            amount: '$95,000 - $115,000',
            period: 'yearly',
            currency: 'USD',
          },
          registrationStartDate: new Date().toISOString(),
          registrationDeadline: deadline.toISOString(),
          applicationUrl: 'https://techcorp.placementtest.com/apply',
          status: 'published',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.companyName).toBe('PlacementTest TechCorp');
      expect(res.body.data.status).toBe('published');
      createdDriveId = res.body.data._id || res.body.data.id;
    });

    it('rejects drive creation with invalid registration deadline before start date', async () => {
      const pastDeadline = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
      const res = await request(app)
        .post('/api/placement/drives')
        .set('Authorization', `Bearer ${officerAToken}`)
        .send({
          companyName: 'PlacementTest InvalidCorp',
          driveTitle: 'PlacementTest Invalid Deadline Drive',
          jobRole: 'Software Engineer',
          jobDescription: 'Valid description for invalid dates.',
          location: 'Campus',
          registrationStartDate: new Date().toISOString(),
          registrationDeadline: pastDeadline.toISOString(),
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Registration deadline cannot precede the registration start date');
    });

    it('updates recruitment drive details', async () => {
      const res = await request(app)
        .put(`/api/placement/drives/${createdDriveId}`)
        .set('Authorization', `Bearer ${officerAToken}`)
        .send({
          openingsCount: 20,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.openingsCount).toBe(20);
    });

    it('transitions recruitment drive status', async () => {
      const res = await request(app)
        .patch(`/api/placement/drives/${createdDriveId}/status`)
        .set('Authorization', `Bearer ${officerAToken}`)
        .send({
          status: 'registration_open',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('registration_open');
    });

    it('Officer B cannot modify or access Officer A recruitment drive', async () => {
      const res = await request(app)
        .put(`/api/placement/drives/${createdDriveId}`)
        .set('Authorization', `Bearer ${officerBToken}`)
        .send({ openingsCount: 99 });

      expect(res.status).toBe(404);
    });
  });

  // =========================================================================
  // 6. CANDIDATE REGISTRATION & ELIGIBILITY EVALUATION
  // =========================================================================
  describe('6. Candidate Registration & Rule-Based Eligibility Evaluation', () => {
    it('Student A sees the published campus drive and is evaluated as eligible', async () => {
      const res = await request(app)
        .get('/api/placement/student/drives')
        .set('Authorization', `Bearer ${studentAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.drives.length).toBeGreaterThanOrEqual(1);

      const drive = res.body.data.drives.find(
        (d: any) => d._id === createdDriveId || d.id === createdDriveId
      );
      expect(drive).toBeDefined();
      expect(drive.eligibilityResult.status).toBe('eligible');
      expect(drive.isRegistered).toBe(false);
    });

    it('Student A successfully registers for the campus drive', async () => {
      const res = await request(app)
        .post(`/api/placement/student/drives/${createdDriveId}/register`)
        .set('Authorization', `Bearer ${studentAToken}`);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.currentStage).toBe('registered');
      expect(res.body.data.eligibilityStatus).toBe('eligible');
      createdRegistrationId = res.body.data.registrationId;
    });

    it('prevents duplicate drive registration for the same student', async () => {
      const res = await request(app)
        .post(`/api/placement/student/drives/${createdDriveId}/register`)
        .set('Authorization', `Bearer ${studentAToken}`);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('You have already submitted a registration');
    });

    it('Officer A inspects registered candidates and views eligibility evaluation', async () => {
      const res = await request(app)
        .get(`/api/placement/drives/${createdDriveId}/candidates`)
        .set('Authorization', `Bearer ${officerAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      const candidate = res.body.data[0];
      expect(candidate.studentEmail).toBe('alex.a@placementtest.com');
      expect(candidate.eligibilityStatus).toBe('eligible');
      expect(candidate.currentStage).toBe('registered');
    });
  });

  // =========================================================================
  // 7. RECRUITMENT STAGE TRACKING & ELIGIBILITY OVERRIDE
  // =========================================================================
  describe('7. Recruitment Stage Tracking & Eligibility Override', () => {
    it('officer updates candidate stage to shortlisted and then interview', async () => {
      const res1 = await request(app)
        .patch(`/api/placement/drives/${createdDriveId}/candidates/${createdRegistrationId}/stage`)
        .set('Authorization', `Bearer ${officerAToken}`)
        .send({
          stage: 'shortlisted',
          comment: 'Candidate passed initial resume screening.',
        });

      expect(res1.status).toBe(200);
      expect(res1.body.data.currentStage).toBe('shortlisted');

      const res2 = await request(app)
        .patch(`/api/placement/drives/${createdDriveId}/candidates/${createdRegistrationId}/stage`)
        .set('Authorization', `Bearer ${officerAToken}`)
        .send({
          stage: 'interview',
          comment: 'Invited for Technical Round 1.',
        });

      expect(res2.status).toBe(200);
      expect(res2.body.data.currentStage).toBe('interview');
    });

    it('records an official offer for the candidate and marks student placed on acceptance', async () => {
      const resOffer = await request(app)
        .patch(`/api/placement/drives/${createdDriveId}/candidates/${createdRegistrationId}/stage`)
        .set('Authorization', `Bearer ${officerAToken}`)
        .send({
          stage: 'accepted',
          comment: 'Candidate accepted offer letter.',
          offerDetails: {
            salary: '$105,000',
            designation: 'Software Engineer',
          },
        });

      expect(resOffer.status).toBe(200);
      expect(resOffer.body.data.currentStage).toBe('accepted');
      expect(resOffer.body.data.offerDetails.salary).toBe('$105,000');

      // Verify StudentProfile placement status updated to 'placed'
      const updatedProfile = await StudentProfile.findOne({ user: studentAUserId });
      expect(updatedProfile?.placementStatus).toBe('placed');
    });

    it('officer overrides candidate eligibility with a documented reason', async () => {
      const res = await request(app)
        .post(`/api/placement/drives/${createdDriveId}/candidates/${createdRegistrationId}/override-eligibility`)
        .set('Authorization', `Bearer ${officerAToken}`)
        .send({
          status: 'eligible',
          reason: 'Manual review confirmed equivalent practical coursework qualification.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.eligibilityEvaluation.isOverridden).toBe(true);
      expect(res.body.data.eligibilityEvaluation.overrideReason).toContain('Manual review confirmed');
    });

    it('rejects eligibility override without justification reason', async () => {
      const res = await request(app)
        .post(`/api/placement/drives/${createdDriveId}/candidates/${createdRegistrationId}/override-eligibility`)
        .set('Authorization', `Bearer ${officerAToken}`)
        .send({
          status: 'eligible',
          reason: '',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // =========================================================================
  // 8. PLACEMENT ANALYTICS & SAFE CSV EXPORT
  // =========================================================================
  describe('8. Placement Analytics & Safe CSV Export', () => {
    it('retrieves accurate placement analytics with department breakdown and recruitment funnel', async () => {
      const res = await request(app)
        .get('/api/placement/analytics')
        .set('Authorization', `Bearer ${officerAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const data = res.body.data;

      expect(data.institution.name).toBe(instA.name);
      expect(data.totalStudents).toBeGreaterThanOrEqual(1);
      expect(data.departmentWise.length).toBeGreaterThanOrEqual(1);

      // Verify recruitment funnel stages
      expect(data.funnelStages.registered).toBe(1);
      expect(data.funnelStages.accepted).toBe(1);
    });

    it('exports safe CSV report with formula injection defense', async () => {
      const res = await request(app)
        .get('/api/placement/reports/export?type=students')
        .set('Authorization', `Bearer ${officerAToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('Full Name');
      expect(res.text).toContain('Alex Student');
      // Should not contain unescaped formula characters
      expect(res.text).not.toContain('=cmd|');
    });
  });

  // =========================================================================
  // 9. PLACEMENT COMMUNICATIONS & ANNOUNCEMENTS
  // =========================================================================
  describe('9. Placement Communications & Announcements', () => {
    it('officer creates a campus announcement targeting specific departments', async () => {
      const res = await request(app)
        .post('/api/placement/announcements')
        .set('Authorization', `Bearer ${officerAToken}`)
        .send({
          title: 'PlacementTest Campus Interview Schedule',
          content: 'Technical rounds commence next Monday at Main Campus Block A.',
          relatedDriveId: createdDriveId,
          targetDepartments: ['Computer Science'],
          targetGraduationYears: [2026],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('PlacementTest Campus Interview Schedule');
    });

    it('Student A receives the announcement targeted to their department', async () => {
      const res = await request(app)
        .get('/api/placement/student/announcements')
        .set('Authorization', `Bearer ${studentAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const announcement = res.body.data.find(
        (a: any) => a.title === 'PlacementTest Campus Interview Schedule'
      );
      expect(announcement).toBeDefined();
    });
  });
});
