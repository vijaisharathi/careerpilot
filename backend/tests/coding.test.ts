import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import m, { Types } from 'mongoose';
import app from '../src/app';
import {
  User,
  Institution,
  CodingQuestion,
  CodingAssessment,
  AssessmentAttempt,
  CodeSubmission,
  StudentSkillAssessmentSummary,
  AuditLog,
} from '../src/models';
import { signAccessToken } from '../src/utils/jwt';
import { codingQuestionService } from '../src/services/codingQuestion.service';
import { codingAssessmentService } from '../src/services/codingAssessment.service';

const TEST_DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/career_pilot_ai_test';

describe('Phase 15: AI-Powered Coding Assessment & Technical Skill Evaluation', () => {
  let adminToken = '';
  let adminUserId = '';

  let officerToken = '';
  let officerUserId = '';

  let studentAToken = '';
  let studentAUserId = '';

  let studentBToken = '';
  let studentBUserId = '';

  let institutionId = '';
  let testQuestionId = '';
  let testAssessmentId = '';

  beforeAll(async () => {
    if (m.connection.readyState === 0) {
      await m.connect(TEST_DB_URI);
    }

    // Clean up test data
    await User.deleteMany({ email: /@codingtest\.com$/ });
    await CodingQuestion.deleteMany({ slug: /test/ });
    await CodingAssessment.deleteMany({ slug: /test/ });
    await AssessmentAttempt.deleteMany({});
    await CodeSubmission.deleteMany({});
    await StudentSkillAssessmentSummary.deleteMany({});
    await AuditLog.deleteMany({ actorEmail: /@codingtest\.com$/ });

    // 1. Create Institution
    const inst = await Institution.create({
      name: 'Apex Institute of Technology',
      code: 'APEXCODING',
      domain: 'apex.edu',
      departments: ['Computer Science', 'Information Technology'],
      isActive: true,
    });
    institutionId = inst._id.toString();

    // 2. Create Admin User
    const adminUser = await User.create({
      name: 'System Admin',
      email: 'admin@codingtest.com',
      password: 'HashedPassword123!',
      role: 'admin',
    });
    adminUserId = adminUser._id.toString();
    adminToken = signAccessToken({
      userId: adminUserId,
      email: adminUser.email,
      role: 'admin',
    });

    // 3. Create Placement Officer User
    const officerUser = await User.create({
      name: 'Placement Officer',
      email: 'officer@codingtest.com',
      password: 'HashedPassword123!',
      role: 'placement_officer',
      institutionId: inst._id,
      assignedDepartment: 'Computer Science',
    });
    officerUserId = officerUser._id.toString();
    officerToken = signAccessToken({
      userId: officerUserId,
      email: officerUser.email,
      role: 'placement_officer',
      institutionId: institutionId,
    });

    // 4. Create Student A User
    const studentA = await User.create({
      name: 'Student Alice',
      email: 'alice@codingtest.com',
      password: 'HashedPassword123!',
      role: 'student',
      institutionId: inst._id,
      assignedDepartment: 'Computer Science',
    });
    studentAUserId = studentA._id.toString();
    studentAToken = signAccessToken({
      userId: studentAUserId,
      email: studentA.email,
      role: 'student',
      institutionId: institutionId,
    });

    // 5. Create Student B User
    const studentB = await User.create({
      name: 'Student Bob',
      email: 'bob@codingtest.com',
      password: 'HashedPassword123!',
      role: 'student',
      institutionId: inst._id,
      assignedDepartment: 'Information Technology',
    });
    studentBUserId = studentB._id.toString();
    studentBToken = signAccessToken({
      userId: studentBUserId,
      email: studentB.email,
      role: 'student',
      institutionId: institutionId,
    });

    // Seed initial questions and assessments
    await codingQuestionService.seedInitialQuestionsIfEmpty();
    await codingAssessmentService.seedInitialAssessmentsIfEmpty();
  });

  afterAll(async () => {
    await User.deleteMany({ email: /@codingtest\.com$/ });
    await Institution.deleteMany({ code: 'APEXCODING' });
    await CodingQuestion.deleteMany({ slug: /test/ });
    await CodingAssessment.deleteMany({ slug: /test/ });
    await AssessmentAttempt.deleteMany({});
    await CodeSubmission.deleteMany({});
    await StudentSkillAssessmentSummary.deleteMany({});
    await AuditLog.deleteMany({ actorEmail: /@codingtest\.com$/ });
  });

  describe('1. Question Bank Management & Hidden Test Case Protection', () => {
    it('allows an authenticated student to list active coding questions', async () => {
      const res = await request(app)
        .get('/api/coding/questions')
        .set('Authorization', `Bearer ${studentAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.questions)).toBe(true);
      expect(res.body.data.questions.length).toBeGreaterThan(0);

      // Verify essential metadata
      const q = res.body.data.questions[0];
      expect(q).toHaveProperty('title');
      expect(q).toHaveProperty('difficulty');
      expect(q).toHaveProperty('category');
      expect(q).toHaveProperty('starterCode');

      // CRITICAL SECURITY CHECK: private test cases must NEVER be returned in listing
      expect(q.privateTestCases).toBeUndefined();
    });

    it('allows an authenticated student to retrieve question details without leaking private test cases or editorial', async () => {
      const listRes = await request(app)
        .get('/api/coding/questions')
        .set('Authorization', `Bearer ${studentAToken}`);

      const firstSlug = listRes.body.data.questions[0].slug;

      const res = await request(app)
        .get(`/api/coding/questions/${firstSlug}`)
        .set('Authorization', `Bearer ${studentAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const q = res.body.data;
      expect(q.slug).toBe(firstSlug);
      expect(Array.isArray(q.sampleTestCases)).toBe(true);
      expect(q.sampleTestCases.length).toBeGreaterThan(0);

      // CRITICAL SECURITY RULE: privateTestCases and editorial must be strictly stripped
      expect(q.privateTestCases).toBeUndefined();
      expect(q.editorial).toBeUndefined();
    });

    it('allows an administrator to create a new coding question with public and private test cases', async () => {
      const payload = {
        title: 'Reverse String In Place Test',
        description: 'Reverse an array of characters in-place with O(1) extra memory.',
        inputFormat: 'Space-separated characters',
        outputFormat: 'Space-separated reversed characters',
        constraints: '1 <= s.length <= 10^5',
        difficulty: 'Easy',
        category: 'Arrays & Strings',
        topicTags: ['two-pointers', 'strings'],
        supportedLanguages: ['python', 'javascript'],
        starterCode: {
          python: 'def reverse_string(s):\n    pass\n',
          javascript: 'function reverseString(s) {}\n',
        },
        sampleTestCases: [
          { input: 'h e l l o', output: 'o l l e h', explanation: 'Reversed order' },
        ],
        privateTestCases: [
          { input: 'H a n n a h', output: 'h a n n a H', isHidden: true, weight: 1 },
          { input: 'a', output: 'a', isHidden: true, weight: 1 },
        ],
      };

      const res = await request(app)
        .post('/api/coding/admin/questions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe(payload.title);
      expect(res.body.data.privateTestCases.length).toBe(2);

      testQuestionId = (res.body.data._id || res.body.data.id).toString();
    });

    it('blocks a non-admin from creating coding questions with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/coding/admin/questions')
        .set('Authorization', `Bearer ${studentAToken}`)
        .send({
          title: 'Unauthorized Question',
          description: 'test',
          inputFormat: 'test',
          outputFormat: 'test',
          constraints: 'test',
          difficulty: 'Easy',
          category: 'Algorithms',
          sampleTestCases: [{ input: '1', output: '1' }],
          privateTestCases: [{ input: '1', output: '1' }],
        });

      expect(res.status).toBe(403);
    });
  });

  describe('2. Code Execution Service & Sample Evaluation', () => {
    it('returns execution sandbox health and supported languages', async () => {
      const res = await request(app)
        .get('/api/coding/engine/status')
        .set('Authorization', `Bearer ${studentAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('provider');
      expect(res.body.data).toHaveProperty('isConfigured');
      expect(res.body.data.supportedLanguages).toEqual(
        expect.arrayContaining(['python', 'javascript', 'java', 'cpp'])
      );
    });

    it('rejects oversized source code exceeding 64KB with an execution error', async () => {
      const oversizedCode = 'x = 1\n'.repeat(30000); // > 150KB

      const res = await request(app)
        .post('/api/coding/run-sample')
        .set('Authorization', `Bearer ${studentAToken}`)
        .send({
          questionId: testQuestionId,
          language: 'python',
          sourceCode: oversizedCode,
        });

      expect(res.status).toBe(400); // Zod validation catches oversized code
    });

    it('executes sample code against public test cases and returns execution metrics', async () => {
      const res = await request(app)
        .post('/api/coding/run-sample')
        .set('Authorization', `Bearer ${studentAToken}`)
        .send({
          questionId: testQuestionId,
          language: 'python',
          sourceCode: 'def reverse_string(s):\n    return s[::-1]',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('status');
      expect(res.body.data).toHaveProperty('testCaseResults');
      expect(res.body.data.totalSampleCases).toBe(1);
      expect(res.body.data.testCaseResults[0]).toHaveProperty('input');
      expect(res.body.data.testCaseResults[0]).toHaveProperty('expectedOutput');
      expect(res.body.data.testCaseResults[0]).toHaveProperty('actualOutput');
      expect(res.body.data.testCaseResults[0]).toHaveProperty('executionTimeMs');
    });

    it('detects syntax and compilation errors during sample execution', async () => {
      const res = await request(app)
        .post('/api/coding/run-sample')
        .set('Authorization', `Bearer ${studentAToken}`)
        .send({
          questionId: testQuestionId,
          language: 'python',
          sourceCode: 'SYNTAX_ERROR: def def invalid syntax',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('compilation_error');
      expect(res.body.data.compilationError).toBeDefined();
    });
  });

  describe('3. Solution Submission, Deterministic Test Evaluation & Private Test Case Secrecy', () => {
    let createdSubmissionId = '';

    it('evaluates solution against public and private test cases, hiding private inputs and expected outputs', async () => {
      const res = await request(app)
        .post('/api/coding/submit')
        .set('Authorization', `Bearer ${studentAToken}`)
        .send({
          questionId: testQuestionId,
          language: 'python',
          sourceCode: 'def reverse_string(s):\n    return s[::-1]',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      const sub = res.body.data;
      expect(sub.status).toBe('accepted');
      expect(sub.passedTestCasesCount).toBe(3); // 1 sample + 2 private
      expect(sub.totalTestCasesCount).toBe(3);
      expect(sub.scoreAwarded).toBe(10);

      createdSubmissionId = sub._id;

      // CRITICAL SECURITY AUDIT: Verify that private test case details are strictly hidden
      const privateResults = sub.testCaseResults.filter((tc: any) => !tc.isPublic);
      expect(privateResults.length).toBe(2);
      privateResults.forEach((tc: any) => {
        expect(tc.input).toBeUndefined();
        expect(tc.expectedOutput).toBeUndefined();
        expect(tc.actualOutput).toBeUndefined();
        expect(tc.isPassed).toBe(true);
      });

      // Public test case can show actual output
      const publicResults = sub.testCaseResults.filter((tc: any) => tc.isPublic);
      expect(publicResults.length).toBe(1);
      expect(publicResults[0].actualOutput).toBeDefined();
    });

    it('records a wrong_answer status when solution fails test cases', async () => {
      const res = await request(app)
        .post('/api/coding/submit')
        .set('Authorization', `Bearer ${studentAToken}`)
        .send({
          questionId: testQuestionId,
          language: 'python',
          sourceCode: 'def reverse_string(s):\n    # WRONG_ANSWER\n    return -1',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('wrong_answer');
      expect(res.body.data.passedTestCasesCount).toBe(0);
      expect(res.body.data.scoreAwarded).toBe(0);
    });

    it('records time_limit_exceeded when solution encounters execution timeout', async () => {
      const res = await request(app)
        .post('/api/coding/submit')
        .set('Authorization', `Bearer ${studentAToken}`)
        .send({
          questionId: testQuestionId,
          language: 'python',
          sourceCode: 'def solution():\n    # TIME_LIMIT_EXCEEDED\n    while True: pass',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('time_limit_exceeded');
    });

    it('generates educational AI feedback for a submission without exposing private evaluation answers', async () => {
      const res = await request(app)
        .post(`/api/coding/submissions/${createdSubmissionId}/ai-feedback`)
        .set('Authorization', `Bearer ${studentAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('explanation');
      expect(res.body.data).toHaveProperty('optimizationSuggestion');
    });

    it('prevents Student B from requesting AI feedback on Student A submission with 403/Error', async () => {
      const res = await request(app)
        .post(`/api/coding/submissions/${createdSubmissionId}/ai-feedback`)
        .set('Authorization', `Bearer ${studentBToken}`);

      expect(res.status).toBe(500); // Throws unauthorized error handled by error middleware
    });
  });

  describe('4. Assessment Lifecycle, Server-Enforced Deadlines & Attempt Limits', () => {
    it('allows an administrator to create and publish a timed coding assessment', async () => {
      const res = await request(app)
        .post('/api/coding/admin/assessments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Algorithms & Problem Solving Benchmark Test',
          description: '60-minute technical evaluation covering algorithms and data structures.',
          type: 'timed',
          targetRole: 'Software Development Engineer',
          categories: ['Arrays & Strings'],
          questions: [
            {
              questionId: testQuestionId,
              marks: 50,
              order: 1,
            },
          ],
          durationMinutes: 60,
          totalMarks: 50,
          passingMarks: 35,
          maxAttempts: 2,
          status: 'published',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toContain('Benchmark Test');
      expect(res.body.data.durationMinutes).toBe(60);

      testAssessmentId = (res.body.data._id || res.body.data.id).toString();
    });

    it('allows a student to start an assessment attempt and calculates server-side expiration', async () => {
      const res = await request(app)
        .post('/api/coding/attempts')
        .set('Authorization', `Bearer ${studentAToken}`)
        .send({
          assessmentId: testAssessmentId,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('in_progress');
      expect(res.body.data.attemptNumber).toBe(1);

      // Verify that expiresAt is calculated on the server ~60 minutes from now
      const started = new Date(res.body.data.startedAt).getTime();
      const expires = new Date(res.body.data.expiresAt).getTime();
      const diffMinutes = Math.round((expires - started) / (60 * 1000));
      expect(diffMinutes).toBe(60);
    });

    it('returns the active assessment session when student refreshes or resumes before deadline', async () => {
      const res = await request(app)
        .post('/api/coding/attempts')
        .set('Authorization', `Bearer ${studentAToken}`)
        .send({
          assessmentId: testAssessmentId,
        });

      // Should resume existing attempt instead of incrementing attempt count
      expect(res.status).toBe(201);
      expect(res.body.data.attemptNumber).toBe(1);
      expect(res.body.data.status).toBe('in_progress');
    });

    it('prevents Student B from viewing Student A assessment attempt session', async () => {
      const activeAttempt = await AssessmentAttempt.findOne({
        studentId: new Types.ObjectId(studentAUserId),
        assessmentId: new Types.ObjectId(testAssessmentId),
      });

      const res = await request(app)
        .get(`/api/coding/attempts/${activeAttempt?._id}`)
        .set('Authorization', `Bearer ${studentBToken}`);

      expect(res.status).toBe(500); // Throws unauthorized error
    });

    it('enforces attempt limits and blocks extra attempts once maxAttempts is exhausted', async () => {
      // Complete attempt 1
      const activeAttempt = await AssessmentAttempt.findOne({
        studentId: new Types.ObjectId(studentAUserId),
        assessmentId: new Types.ObjectId(testAssessmentId),
      });
      activeAttempt!.status = 'completed';
      await activeAttempt!.save();

      // Start attempt 2
      const res2 = await request(app)
        .post('/api/coding/attempts')
        .set('Authorization', `Bearer ${studentAToken}`)
        .send({ assessmentId: testAssessmentId });
      expect(res2.status).toBe(201);
      expect(res2.body.data.attemptNumber).toBe(2);

      // Complete attempt 2
      const attempt2 = await AssessmentAttempt.findById(res2.body.data._id);
      attempt2!.status = 'completed';
      await attempt2!.save();

      // Try to start attempt 3 (should be rejected since maxAttempts = 2)
      const res3 = await request(app)
        .post('/api/coding/attempts')
        .set('Authorization', `Bearer ${studentAToken}`)
        .send({ assessmentId: testAssessmentId });

      expect(res3.status).toBe(500); // Throws attempt limit reached error
    });
  });

  describe('5. Student Technical Skill Profile & Placement Officer Integration', () => {
    it('retrieves the authenticated student technical skill summary', async () => {
      const res = await request(app)
        .get('/api/coding/skill-profile')
        .set('Authorization', `Bearer ${studentAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('overallCodingScore');
      expect(res.body.data).toHaveProperty('totalProblemsSolved');
      expect(res.body.data).toHaveProperty('categoryProficiencies');
      expect(res.body.data.totalProblemsSolved).toBeGreaterThanOrEqual(1);
    });

    it('allows an authorized Placement Officer to view aggregate institutional coding analytics', async () => {
      const res = await request(app)
        .get('/api/coding/placement/analytics')
        .set('Authorization', `Bearer ${officerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalStudentsEvaluated');
      expect(res.body.data).toHaveProperty('averageCodingScore');
      expect(res.body.data).toHaveProperty('categoryPerformance');
      expect(res.body.data).toHaveProperty('topPerformers');
    });

    it('allows an authorized Placement Officer to inspect a candidate technical skill summary', async () => {
      const res = await request(app)
        .get(`/api/coding/placement/candidates/${studentAUserId}/summary`)
        .set('Authorization', `Bearer ${officerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('overallCodingScore');
      expect(res.body.data).toHaveProperty('categoryProficiencies');
    });

    it('blocks a student from accessing Placement Officer coding analytics with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/coding/placement/analytics')
        .set('Authorization', `Bearer ${studentAToken}`);

      expect(res.status).toBe(403);
    });
  });
});
