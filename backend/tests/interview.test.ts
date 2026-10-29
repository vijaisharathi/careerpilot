import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import m from 'mongoose';
import app from '../src/app';
import { User } from '../src/models/user.model';
import { InterviewSession } from '../src/models/interviewSession.model';

const TEST_DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/career_pilot_ai_test';

describe('AI Interview Preparation Module', () => {
  let tokenUserA = '';
  let tokenUserB = '';
  let sessionAId = '';

  const studentA = {
    name: 'Vikram Seth',
    email: 'vikram.seth@interviewtest.com',
    password: 'Password2026!',
    role: 'student',
  };

  const studentB = {
    name: 'Ananya Roy',
    email: 'ananya.roy@interviewtest.com',
    password: 'Password2026!',
    role: 'student',
  };

  beforeAll(async () => {
    if (m.connection.readyState === 0) {
      await m.connect(TEST_DB_URI);
    }
    await User.deleteMany({ email: /@interviewtest\.com$/ });
    await InterviewSession.deleteMany({});

    // Register Student A
    const resA = await request(app).post('/api/auth/register').send(studentA);
    tokenUserA = resA.body.data.token;

    // Register Student B
    const resB = await request(app).post('/api/auth/register').send(studentB);
    tokenUserB = resB.body.data.token;
  });

  afterAll(async () => {
    await User.deleteMany({ email: /@interviewtest\.com$/ });
    await InterviewSession.deleteMany({});
    await m.disconnect();
  });

  // 1. Session Initialization & Question Generation
  describe('Interview Session Initialization & Question Generation', () => {
    it('creates a new technical interview session with role-relevant questions', async () => {
      const res = await request(app)
        .post('/api/interviews')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          targetRole: 'Full-Stack Developer',
          interviewType: 'technical',
          difficulty: 'Intermediate',
          questionCount: 3,
          topics: ['React', 'Idempotency', 'Caching'],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      const session = res.body.data;
      expect(session._id).toBeDefined();
      expect(session.targetRole).toBe('Full-Stack Developer');
      expect(session.interviewType).toBe('technical');
      expect(session.difficulty).toBe('Intermediate');
      expect(session.status).toBe('in_progress');
      expect(session.currentQuestionIndex).toBe(0);
      expect(session.totalQuestions).toBe(3);
      expect(session.questions.length).toBe(3);

      // Verify question schema
      const firstQ = session.questions[0];
      expect(firstQ.questionText).toBeDefined();
      expect(firstQ.expectedKeyConcepts.length).toBeGreaterThan(0);
      expect(firstQ.hints).toBeInstanceOf(Array);

      sessionAId = session._id;
    });

    it('creates an HR / behavioral interview session with STAR method focus', async () => {
      const res = await request(app)
        .post('/api/interviews')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          targetRole: 'Frontend Developer',
          interviewType: 'hr',
          difficulty: 'Intermediate',
          questionCount: 2,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.interviewType).toBe('hr');
      expect(res.body.data.questions.length).toBe(2);
      expect(res.body.data.questions[0].category).toBe('hr');
    });

    it('rejects session creation when target role is missing', async () => {
      const res = await request(app)
        .post('/api/interviews')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          interviewType: 'technical',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation failed');
    });
  });

  // 2. Sequential Question Answering & Evaluation
  describe('Answer Submission & Criteria-Based Evaluation', () => {
    it('evaluates a technical answer against rubric and advances question index', async () => {
      const answer = `
        React uses a Virtual DOM tree and a heuristic O(n) diffing reconciliation algorithm to detect changes.
        When component state updates, React re-renders the component and its children.
        To optimize performance and avoid unnecessary renders, we use React.memo for pure components,
        useCallback to preserve function references across renders, useMemo to cache expensive computations,
        and provide unique stable keys for list items.
      `;

      const res = await request(app)
        .post(`/api/interviews/${sessionAId}/answers`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          questionIndex: 0,
          studentAnswer: answer,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const session = res.body.data;
      const evaluatedQ = session.questions[0];
      expect(evaluatedQ.studentAnswer).toContain('React uses a Virtual DOM');
      expect(evaluatedQ.evaluation).toBeDefined();
      expect(evaluatedQ.evaluation.overallScore).toBeGreaterThanOrEqual(60);
      expect(evaluatedQ.evaluation.correctness).toBeGreaterThanOrEqual(50);
      expect(evaluatedQ.evaluation.completeness).toBeGreaterThanOrEqual(50);
      expect(evaluatedQ.evaluation.clarity).toBeGreaterThanOrEqual(50);
      expect(evaluatedQ.evaluation.strengths.length).toBeGreaterThan(0);
      expect(evaluatedQ.evaluation.suggestedImprovedAnswer).toBeDefined();
      expect(evaluatedQ.evaluation.rubricExplanation).toBeDefined();

      // Question index should advance to 1
      expect(session.currentQuestionIndex).toBe(1);
      expect(session.status).toBe('in_progress');
    });

    it('identifies uncertain assessment when answer is very brief', async () => {
      const briefAnswer = 'It diffs nodes and updates them.';

      const res = await request(app)
        .post(`/api/interviews/${sessionAId}/answers`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          questionIndex: 1,
          studentAnswer: briefAnswer,
        });

      expect(res.status).toBe(200);
      const evalResult = res.body.data.questions[1].evaluation;
      expect(evalResult.isUncertainAssessment).toBe(true);
      expect(evalResult.rubricExplanation).toContain('uncertainty');
      expect(evalResult.missingConcepts.length).toBeGreaterThan(0);
    });

    it('rejects empty or whitespace-only answers', async () => {
      const res = await request(app)
        .post(`/api/interviews/${sessionAId}/answers`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          questionIndex: 2,
          studentAnswer: '    ',
        });

      expect(res.status).toBe(400);
    });
  });

  // 3. Completion & Session Summary
  describe('Session Completion & Summary Generation', () => {
    it('completes the session upon answering all questions and calculates performance summary', async () => {
      const answerQ3 = `
        To design a high-throughput caching layer with Redis, I use the Cache-Aside pattern.
        To solve cache stampede (thundering herd), I use a distributed mutex lock so only one thread queries the primary database.
        For cache penetration, I use Bloom filters and cache null results with a short TTL.
        Eviction is managed via LRU policies and memory limits.
      `;

      const res = await request(app)
        .post(`/api/interviews/${sessionAId}/answers`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          questionIndex: 2,
          studentAnswer: answerQ3,
        });

      expect(res.status).toBe(200);
      const session = res.body.data;
      expect(session.status).toBe('completed');
      expect(session.completedAt).toBeDefined();

      // Summary
      const summary = session.summary;
      expect(summary).toBeDefined();
      expect(summary.overallScore).toBeGreaterThan(0);
      expect(summary.averageCorrectness).toBeGreaterThan(0);
      expect(summary.averageCompleteness).toBeGreaterThan(0);
      expect(summary.totalAnswered).toBe(3);
      expect(summary.keyStrengths.length).toBeGreaterThan(0);
      expect(summary.overallRecommendation).toBeDefined();
    });

    it('rejects further answer submissions once session is completed', async () => {
      const res = await request(app)
        .post(`/api/interviews/${sessionAId}/answers`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          questionIndex: 0,
          studentAnswer: 'New answer after completion',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already closed or completed');
    });
  });

  // 4. Session Recovery, Abandonment & History
  describe('Session Recovery & Practice History', () => {
    it('retrieves student interview sessions history', async () => {
      const res = await request(app)
        .get('/api/interviews')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('allows recovering active in-progress session if one exists', async () => {
      // Start a new in-progress session
      const createRes = await request(app)
        .post('/api/interviews')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          targetRole: 'Data Scientist',
          interviewType: 'technical',
          questionCount: 3,
        });

      const inProgressId = createRes.body.data._id;

      // Recover via /current
      const currentRes = await request(app)
        .get('/api/interviews/current')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(currentRes.status).toBe(200);
      expect(currentRes.body.data._id).toBe(inProgressId);

      // Abandon the session
      const abandonRes = await request(app)
        .post(`/api/interviews/${inProgressId}/abandon`)
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(abandonRes.status).toBe(200);
      expect(abandonRes.body.data.status).toBe('abandoned');
    });

    it('calculates aggregate practice progress statistics', async () => {
      const res = await request(app)
        .get('/api/interviews/stats')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      const stats = res.body.data;
      expect(stats.totalSessions).toBeGreaterThanOrEqual(2);
      expect(stats.completedSessions).toBeGreaterThanOrEqual(1);
      expect(stats.averageOverallScore).toBeGreaterThan(0);
      expect(stats.totalQuestionsAnswered).toBeGreaterThan(0);
    });
  });

  // 5. Multi-Tenant Cross-User Isolation
  describe('Multi-Tenant Cross-User Security', () => {
    it('prevents Student B from accessing Student A interview session', async () => {
      const res = await request(app)
        .get(`/api/interviews/${sessionAId}`)
        .set('Authorization', `Bearer ${tokenUserB}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('not authorized');
    });

    it('prevents Student B from submitting answers to Student A session', async () => {
      const res = await request(app)
        .post(`/api/interviews/${sessionAId}/answers`)
        .set('Authorization', `Bearer ${tokenUserB}`)
        .send({
          questionIndex: 0,
          studentAnswer: 'Unauthorized answer attempt',
        });

      expect(res.status).toBe(403);
    });

    it('prevents Student B from abandoning Student A session', async () => {
      const res = await request(app)
        .post(`/api/interviews/${sessionAId}/abandon`)
        .set('Authorization', `Bearer ${tokenUserB}`);

      expect(res.status).toBe(403);
    });
  });
});

