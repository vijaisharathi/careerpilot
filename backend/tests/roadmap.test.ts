import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import m from 'mongoose';
import app from '../src/app';
import { User } from '../src/models/user.model';
import { StudentProfile } from '../src/models/studentProfile.model';
import { LearningRoadmap } from '../src/models/learningRoadmap.model';

const TEST_DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/career_pilot_ai_test';

describe('Personalized Learning Roadmap Module', () => {
  let tokenUserA = '';
  let tokenUserB = '';
  let activeRoadmapA: any = null;
  let firstTaskIdA = '';
  let secondTaskIdA = '';

  const studentA = {
    name: 'Siddharth Rao',
    email: 'siddharth@roadmaptest.com',
    password: 'Password2026!',
    profile: {
      college: 'MIT Manipal',
      degree: 'B.Tech',
      department: 'Computer Science',
      graduationYear: 2027,
      skills: ['TypeScript', 'JavaScript (ES6+)', 'React.js', 'Node.js & Express'],
      targetRoles: ['Full-Stack Developer'],
    },
  };

  const studentB = {
    name: 'Ananya Sharma',
    email: 'ananya@roadmaptest.com',
    password: 'Password2026!',
    profile: {
      college: 'IIT Madras',
      degree: 'B.Tech',
      department: 'Data Science',
      graduationYear: 2026,
      skills: ['Python', 'SQL'],
      targetRoles: ['Data Scientist'],
    },
  };

  beforeAll(async () => {
    if (m.connection.readyState === 0) {
      await m.connect(TEST_DB_URI);
    }
    await User.deleteMany({ email: /@roadmaptest\.com$/ });
    await StudentProfile.deleteMany({ email: /@roadmaptest\.com$/ });
    await LearningRoadmap.deleteMany({});

    // Register Student A
    const resA = await request(app).post('/api/auth/register').send(studentA);
    tokenUserA = resA.body.data.tokens.accessToken;

    // Register Student B
    const resB = await request(app).post('/api/auth/register').send(studentB);
    tokenUserB = resB.body.data.tokens.accessToken;
  });

  afterAll(async () => {
    await User.deleteMany({ email: /@roadmaptest\.com$/ });
    await StudentProfile.deleteMany({ email: /@roadmaptest\.com$/ });
    await LearningRoadmap.deleteMany({});
  });

  describe('1. Unauthenticated Security Checks', () => {
    it('GET /api/roadmap rejects unauthenticated request with 401', async () => {
      const res = await request(app).get('/api/roadmap');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/roadmap/generate rejects unauthenticated request with 401', async () => {
      const res = await request(app).post('/api/roadmap/generate').send({});
      expect(res.status).toBe(401);
    });
  });

  describe('2. Roadmap Generation & Structure', () => {
    it('GET /api/roadmap returns null when no roadmap generated yet', async () => {
      const res = await request(app)
        .get('/api/roadmap')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeNull();
    });

    it('POST /api/roadmap/generate validates weeklyHours and totalWeeks constraints', async () => {
      const resTooLow = await request(app)
        .post('/api/roadmap/generate')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ weeklyHours: 1, totalWeeks: 1 });

      expect(resTooLow.status).toBe(400);
      expect(resTooLow.body.success).toBe(false);

      const resTooHigh = await request(app)
        .post('/api/roadmap/generate')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ weeklyHours: 60, totalWeeks: 50 });

      expect(resTooHigh.status).toBe(400);
      expect(resTooHigh.body.success).toBe(false);
    });

    it('POST /api/roadmap/generate creates a personalized structured roadmap', async () => {
      const res = await request(app)
        .post('/api/roadmap/generate')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          targetRoleSlug: 'full-stack-developer',
          weeklyHours: 10,
          totalWeeks: 8,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      const data = res.body.data;
      activeRoadmapA = data;

      expect(data.targetRole.title).toBe('Full-Stack Developer');
      expect(data.weeklyHours).toBe(10);
      expect(data.totalWeeks).toBe(8);
      expect(data.overallProgress).toBe(0);
      expect(data.completedTasks).toBe(0);
      expect(data.status).toBe('in-progress');

      // Verify 3 Phases
      expect(data.phases).toHaveLength(3);
      expect(data.phases[0].phaseNumber).toBe(1);
      expect(data.phases[0].status).toBe('in-progress');
      expect(data.phases[1].phaseNumber).toBe(2);
      expect(data.phases[2].phaseNumber).toBe(3);

      // Verify weeks distribution
      const totalGeneratedWeeks = data.phases.reduce(
        (sum: number, p: any) => sum + p.weeks.length,
        0
      );
      expect(totalGeneratedWeeks).toBe(8);

      // Verify tasks and verified resources
      const allTasks = data.phases.flatMap((p: any) => p.weeks.flatMap((w: any) => w.tasks));
      expect(allTasks.length).toBeGreaterThan(15);
      expect(data.totalTasks).toBe(allTasks.length);

      // Extract first two tasks for completion tests
      firstTaskIdA = allTasks[0]._id;
      secondTaskIdA = allTasks[1]._id;

      // Check task properties
      const sampleTask = allTasks[0];
      expect(sampleTask).toHaveProperty('taskKey');
      expect(sampleTask).toHaveProperty('title');
      expect(sampleTask).toHaveProperty('type');
      expect(sampleTask).toHaveProperty('learningObjective');
      expect(sampleTask).toHaveProperty('estimatedMinutes');
      expect(sampleTask.completed).toBe(false);
      expect(sampleTask.resources.length).toBeGreaterThan(0);
      expect(sampleTask.resources[0].url).toMatch(/^https:\/\//);
      expect(sampleTask.resources[0].isFree).toBe(true);
    });

    it('GET /api/roadmap retrieves the created active roadmap', async () => {
      const res = await request(app)
        .get('/api/roadmap')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(activeRoadmapA._id);
      expect(res.body.data.targetRole.slug).toBe('full-stack-developer');
    });
  });

  describe('3. Task Completion & Dynamic Progress Tracking', () => {
    it('PATCH /api/roadmap/tasks/:taskId marks task completed and recalculates progress', async () => {
      const res = await request(app)
        .patch(`/api/roadmap/tasks/${firstTaskIdA}`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ completed: true });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const data = res.body.data;

      expect(data.completedTasks).toBe(1);
      expect(data.overallProgress).toBeGreaterThan(0);

      // Find the task in returned roadmap
      const task = data.phases
        .flatMap((p: any) => p.weeks.flatMap((w: any) => w.tasks))
        .find((t: any) => t._id === firstTaskIdA);

      expect(task.completed).toBe(true);
      expect(task.completedAt).not.toBeNull();
    });

    it('Completing a second task increments progress further', async () => {
      const res = await request(app)
        .patch(`/api/roadmap/tasks/${secondTaskIdA}`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ completed: true });

      expect(res.status).toBe(200);
      const data = res.body.data;
      expect(data.completedTasks).toBe(2);
      expect(data.overallProgress).toBeGreaterThan(3);
    });

    it('Toggling task completion back to false decrements progress and unsets completedAt', async () => {
      const res = await request(app)
        .patch(`/api/roadmap/tasks/${secondTaskIdA}`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ completed: false });

      expect(res.status).toBe(200);
      const data = res.body.data;
      expect(data.completedTasks).toBe(1);

      const task = data.phases
        .flatMap((p: any) => p.weeks.flatMap((w: any) => w.tasks))
        .find((t: any) => t._id === secondTaskIdA);

      expect(task.completed).toBe(false);
      expect(task.completedAt).toBeNull();
    });

    it('Returns 404 if updating non-existent taskId', async () => {
      const fakeId = new m.Types.ObjectId().toString();
      const res = await request(app)
        .patch(`/api/roadmap/tasks/${fakeId}`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ completed: true });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('4. Schedule Adjustment', () => {
    it('PATCH /api/roadmap/schedule updates weekly hours and duration', async () => {
      const res = await request(app)
        .patch('/api/roadmap/schedule')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ weeklyHours: 15, totalWeeks: 10 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.weeklyHours).toBe(15);
      expect(res.body.data.totalWeeks).toBe(10);
    });

    it('PATCH /api/roadmap/schedule validates input bounds', async () => {
      const res = await request(app)
        .patch('/api/roadmap/schedule')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ weeklyHours: 50 });

      expect(res.status).toBe(400);
    });
  });

  describe('5. Regeneration & Progress Preservation', () => {
    it('POST /api/roadmap/regenerate archives old roadmap and preserves completed task status', async () => {
      // First, confirm task 1 was completed in old roadmap
      const resRegen = await request(app)
        .post('/api/roadmap/regenerate')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          targetRoleSlug: 'full-stack-developer',
          weeklyHours: 12,
          totalWeeks: 8,
          preserveProgress: true,
        });

      expect(resRegen.status).toBe(201);
      expect(resRegen.body.success).toBe(true);
      const newRoadmap = resRegen.body.data;

      expect(newRoadmap.version).toBe(2);
      expect(newRoadmap.weeklyHours).toBe(12);

      // Verify that previously completed task progress was preserved!
      expect(newRoadmap.completedTasks).toBeGreaterThanOrEqual(1);
      expect(newRoadmap.overallProgress).toBeGreaterThan(0);

      // Verify old roadmap is now archived
      const oldRoadmapDoc = await LearningRoadmap.findById(activeRoadmapA._id);
      expect(oldRoadmapDoc?.status).toBe('archived');
    });
  });

  describe('6. Cross-User Isolation & Ownership Enforcement', () => {
    it('Student B cannot complete or toggle Student A roadmap task (404/403 isolation)', async () => {
      const res = await request(app)
        .patch(`/api/roadmap/tasks/${firstTaskIdA}`)
        .set('Authorization', `Bearer ${tokenUserB}`)
        .send({ completed: true });

      // Student B has no active roadmap yet or the task is not in their roadmap
      expect([403, 404]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });

    it('Student B generating roadmap creates isolated roadmap for Student B', async () => {
      const resB = await request(app)
        .post('/api/roadmap/generate')
        .set('Authorization', `Bearer ${tokenUserB}`)
        .send({
          targetRoleSlug: 'data-scientist',
          weeklyHours: 10,
          totalWeeks: 6,
        });

      expect(resB.status).toBe(201);
      expect(resB.body.data.targetRole.slug).toBe('data-scientist');

      // Check Student A roadmap was not affected
      const resA = await request(app)
        .get('/api/roadmap')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(resA.body.data.targetRole.slug).toBe('full-stack-developer');
      expect(resA.body.data.version).toBe(2);
    });
  });
});

