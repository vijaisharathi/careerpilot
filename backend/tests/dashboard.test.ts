import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import m from 'mongoose';
import app from '../src/app';
import { User } from '../src/models/user.model';
import { StudentProfile } from '../src/models/studentProfile.model';
import { CareerAnalysis } from '../src/models/careerAnalysis.model';
import { LearningRoadmap } from '../src/models/learningRoadmap.model';
import { JobApplication } from '../src/models/jobApplication.model';
import { InterviewSession } from '../src/models/interviewSession.model';
import { ResumeAnalysis } from '../src/models/resumeAnalysis.model';
import { Notification } from '../src/models/notification.model';
import { NotificationPreference } from '../src/models/notificationPreference.model';

const TEST_DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/career_pilot_ai_test';

describe('Dashboard Analytics & In-App Notifications Module', () => {
  let tokenUserA = '';
  let tokenUserB = '';
  let userAId = '';
  let userBId = '';

  const studentA = {
    name: 'Ananya Sharma',
    email: 'ananya.sharma@dashboardtest.com',
    password: 'Password2026!',
    role: 'student',
  };

  const studentB = {
    name: 'Rahul Verma',
    email: 'rahul.verma@dashboardtest.com',
    password: 'Password2026!',
    role: 'student',
  };

  beforeAll(async () => {
    if (m.connection.readyState === 0) {
      await m.connect(TEST_DB_URI);
    }
    await User.deleteMany({ email: /@dashboardtest\.com$/ });
    // 1. Register Student A
    const resA = await request(app).post('/api/auth/register').send(studentA);
    tokenUserA = resA.body.data.tokens.accessToken;
    userAId = resA.body.data.user.id;

    // 2. Register Student B
    const resB = await request(app).post('/api/auth/register').send(studentB);
    tokenUserB = resB.body.data.tokens.accessToken;
    userBId = resB.body.data.user.id;

    const userObjIds = [new m.Types.ObjectId(userAId), new m.Types.ObjectId(userBId)];
    await Notification.deleteMany({ user: { $in: userObjIds } });
    await NotificationPreference.deleteMany({ user: { $in: userObjIds } });
    await CareerAnalysis.deleteMany({ user: { $in: userObjIds } });
    await LearningRoadmap.deleteMany({ user: { $in: userObjIds } });
    await JobApplication.deleteMany({ user: { $in: userObjIds } });
    await InterviewSession.deleteMany({ user: { $in: userObjIds } });
    await ResumeAnalysis.deleteMany({ user: { $in: userObjIds } });
  });

  afterAll(async () => {
    await User.deleteMany({ email: /@dashboardtest\.com$/ });
    if (userAId && userBId) {
      const userObjIds = [new m.Types.ObjectId(userAId), new m.Types.ObjectId(userBId)];
      await Notification.deleteMany({ user: { $in: userObjIds } });
      await NotificationPreference.deleteMany({ user: { $in: userObjIds } });
      await CareerAnalysis.deleteMany({ user: { $in: userObjIds } });
      await LearningRoadmap.deleteMany({ user: { $in: userObjIds } });
      await JobApplication.deleteMany({ user: { $in: userObjIds } });
      await InterviewSession.deleteMany({ user: { $in: userObjIds } });
      await ResumeAnalysis.deleteMany({ user: { $in: userObjIds } });
    }
  });

  describe('1. Dashboard Summary with Fresh Student (Honest Empty State)', () => {
    it('returns 200 with honest metrics and no fabricated data for brand-new student', async () => {
      const res = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${tokenUserB}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const data = res.body.data;

      // Profile completion is low/empty, not fabricated 100%
      expect(data.profile.name).toBe('Rahul Verma');
      expect(typeof data.profile.completionPercentage).toBe('number');
      expect(data.profile.skillsCount).toBe(0);

      // Career Analysis is missing
      expect(data.careerAnalysis.hasAnalysis).toBe(false);
      expect(data.careerAnalysis.readinessScore).toBeUndefined();

      // Roadmap is missing
      expect(data.roadmap.hasRoadmap).toBe(false);
      expect(data.roadmap.totalTasks).toBeUndefined();

      // Applications are 0
      expect(data.applications.totalApplications).toBe(0);
      expect(data.applications.responseRatePercentage).toBe(0);
      expect(data.upcomingInterviews).toHaveLength(0);
      expect(data.pendingFollowUps.overdue).toHaveLength(0);

      // Interview sessions & resume are missing
      expect(data.recentInterviewPractice).toHaveLength(0);
      expect(data.resumeAnalysis.hasAnalysis).toBe(false);

      // Recommended actions prompt profile completion & career analysis
      expect(data.recommendedNextActions.length).toBeGreaterThan(0);
      const actionTitles = data.recommendedNextActions.map((a: { title: string }) => a.title);
      expect(actionTitles.some((t: string) => t.includes('Profile') || t.includes('Career'))).toBe(true);
    });
  });

  describe('2. Dashboard Summary with Comprehensive Student Data', () => {
    beforeAll(async () => {
      const uAObjectId = new m.Types.ObjectId(userAId);

      // Complete Profile for User A
      await StudentProfile.findOneAndUpdate(
        { user: uAObjectId },
        {
          fullName: 'Ananya Sharma',
          college: 'Birla Institute of Technology and Science',
          degree: 'B.E.',
          department: 'Computer Science',
          graduationYear: 2026,
          educationHistory: [
            {
              institution: 'Birla Institute of Technology and Science',
              degree: 'B.E.',
              field: 'Computer Science',
              startDate: '2022-08',
              endDate: '2026-05',
            },
          ],
          skills: [
            { name: 'TypeScript', category: 'languages', proficiency: 'Advanced', verified: false },
            { name: 'React', category: 'frameworks', proficiency: 'Advanced', verified: true },
            { name: 'Node.js', category: 'frameworks', proficiency: 'Intermediate', verified: false },
          ],
          careerInterests: {
            targetRoles: ['Full Stack Developer', 'Frontend Developer'],
            preferredLocations: ['Bengaluru', 'Remote'],
            preferredMode: 'Remote',
          },
          projects: [
            {
              title: 'E-commerce Platform',
              technologies: ['React', 'Node.js', 'PostgreSQL'],
              bullets: ['Built scalable store'],
            },
          ],
          experience: [],
          certifications: [
            {
              title: 'AWS Certified Cloud Practitioner',
              issuer: 'Amazon Web Services',
              issueDate: '2025-01',
            },
          ],
        }
      );

      // Create Career Analysis for User A
      await CareerAnalysis.create({
        user: uAObjectId,
        profileId: new m.Types.ObjectId(),
        targetRole: {
          title: 'Full Stack Developer',
          slug: 'full-stack-developer',
          category: 'Software Engineering',
        },
        profileSnapshot: {
          skillsCount: 3,
          projectsCount: 1,
          experienceCount: 0,
          lastProfileUpdate: new Date(),
        },
        scores: {
          readinessScore: 78,
          skillMatchScore: 80,
          projectScore: 75,
          experienceScore: 70,
          academicScore: 85,
          suitabilityLevel: 'High Match',
        },
        matchedSkills: [
          {
            name: 'React',
            category: 'frontend',
            studentLevel: 'Advanced',
            requiredLevel: 'Intermediate',
            status: 'exceeded',
            creditPercentage: 100,
          },
        ],
        missingSkills: [
          {
            name: 'Docker',
            category: 'devops',
            requiredLevel: 'Intermediate',
            importance: 'critical',
            estimatedHours: 15,
          },
          {
            name: 'Kubernetes',
            category: 'cloud',
            requiredLevel: 'Beginner',
            importance: 'recommended',
            estimatedHours: 20,
          },
        ],
        strengths: ['Solid React and modern JavaScript experience'],
        improvementAreas: ['Container orchestration and deployment'],
        aiExplanation: {
          executiveSummary: 'Strong candidate for full-stack web roles with containerization gaps.',
          strengthsNarrative: 'Solid JavaScript/TypeScript foundations.',
          gapAnalysisNarrative: 'Focus on containerization with Docker.',
          tailoredProjects: [],
          tailoredCertifications: [
            { title: 'AWS Certified Solutions Architect', issuer: 'Amazon', priority: 'High' },
          ],
          actionPlan: [],
          aiProvider: 'mock',
          isAiSimulated: true,
        },
      });

      // Create Learning Roadmap for User A (2 tasks: 1 completed, 1 pending)
      await LearningRoadmap.create({
        user: uAObjectId,
        profileId: new m.Types.ObjectId(),
        targetRole: {
          slug: 'full-stack-developer',
          title: 'Full Stack Developer',
          category: 'Software Engineering',
        },
        weeklyHours: 10,
        totalWeeks: 6,
        totalTasks: 2,
        completedTasks: 1,
        overallProgress: 50,
        status: 'in-progress',
        phases: [
          {
            phaseNumber: 1,
            title: 'Containerization Basics',
            description: 'Learn Docker and containers',
            status: 'in-progress',
            progress: 50,
            weeks: [
              {
                weekNumber: 1,
                theme: 'Docker Core Concepts',
                tasks: [
                  {
                    taskKey: 'task-docker-intro',
                    title: 'Dockerfiles and Images',
                    type: 'Hands-on Exercise',
                    learningObjective: 'Build container images from scratch',
                    estimatedMinutes: 60,
                    completed: true,
                    completedAt: new Date(),
                    resources: [],
                  },
                  {
                    taskKey: 'task-docker-compose',
                    title: 'Multi-container Docker Compose',
                    type: 'Project',
                    learningObjective: 'Orchestrate multi-service applications',
                    estimatedMinutes: 90,
                    completed: false,
                    resources: [],
                  },
                ],
              },
            ],
          },
        ],
      });

      // Create Job Applications: 1 Applied, 1 Interview (upcoming), 1 Assessment (overdue follow-up), 1 Saved
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 3);

      await JobApplication.create([
        {
          user: uAObjectId,
          company: 'TechFlow Systems',
          jobTitle: 'Junior Full Stack Engineer',
          applicationUrl: 'https://techflow.example.com/apply',
          dateApplied: new Date(),
          status: 'Interview',
          interviewDate: tomorrow,
          notes: 'Technical rounds scheduled',
        },
        {
          user: uAObjectId,
          company: 'CloudNative Corp',
          jobTitle: 'Backend Node.js Developer',
          applicationUrl: 'https://cloudnative.example.com/jobs/1',
          dateApplied: yesterday,
          status: 'Assessment',
          followUpDate: yesterday, // overdue follow up
          notes: 'Completed assessment test, awaiting response',
        },
        {
          user: uAObjectId,
          company: 'Acme Software',
          jobTitle: 'Frontend Engineer',
          applicationUrl: 'https://acme.example.com/fe',
          dateApplied: new Date(),
          status: 'Applied',
        },
        {
          user: uAObjectId,
          company: 'FutureLabs Inc',
          jobTitle: 'DevOps Intern',
          applicationUrl: 'https://futurelabs.example.com/intern',
          status: 'Saved',
        },
      ]);

      // Create Interview Session
      await InterviewSession.create({
        user: uAObjectId,
        targetRole: 'Full Stack Developer',
        interviewType: 'technical',
        difficulty: 'Intermediate',
        topics: ['Node.js', 'React'],
        status: 'completed',
        totalQuestions: 3,
        currentQuestionIndex: 3,
        startedAt: new Date(),
        completedAt: new Date(),
        summary: {
          overallScore: 85,
          averageCorrectness: 85,
          averageCompleteness: 80,
          averageClarity: 90,
          totalAnswered: 3,
          keyStrengths: ['Strong API design knowledge'],
          areasForImprovement: ['Elaborate on database indexing'],
          overallRecommendation: 'Ready for junior full-stack interviews',
          completedAt: new Date(),
        },
        questions: [],
      });

      // Create Resume Analysis
      await ResumeAnalysis.create({
        user: uAObjectId,
        targetJobTitle: 'Full Stack Developer',
        targetJobDescription: 'Seeking full stack developer with React, Node.js, and Docker experience.',
        originalFileName: 'ananya_resume.pdf',
        fileSize: 45000,
        extractedTextLength: 2100,
        extractedTextPreview: 'Ananya Sharma - Full Stack Engineer Resume...',
        scores: {
          overallScore: 88,
          keywordMatchScore: 85,
          formattingScore: 90,
          sectionCompletenessScore: 90,
          impactScore: 85,
        },
        matchedKeywords: ['TypeScript', 'React', 'Node.js'],
        missingKeywords: ['Docker', 'CI/CD pipelines', 'Kubernetes'],
        sectionFeedback: [
          { section: 'Projects', status: 'pass', feedback: 'Clear technical descriptions.' },
        ],
        bulletImprovements: [],
        actionableRecommendations: ['Add metrics to recent project achievements.'],
        atsDisclaimer: 'Algorithmic heuristic evaluation based on provided description.',
      });
    });

    it('calculates authentic metrics matching mathematical formulas across all models', async () => {
      const res = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      const data = res.body.data;

      // Profile is marked complete and > 80%
      expect(data.profile.completionPercentage).toBeGreaterThanOrEqual(80);

      // Career Analysis
      expect(data.careerAnalysis.hasAnalysis).toBe(true);
      expect(data.careerAnalysis.targetRole).toBe('Full Stack Developer');
      expect(data.careerAnalysis.readinessScore).toBe(78);
      expect(data.skillGaps.some((g: { name: string }) => g.name === 'Docker')).toBe(true);

      // Roadmap: 1 of 2 tasks completed = 50%
      expect(data.roadmap.hasRoadmap).toBe(true);
      expect(data.roadmap.completedTasks).toBe(1);
      expect(data.roadmap.totalTasks).toBe(2);
      expect(data.roadmap.overallProgress).toBe(50);
      expect(data.roadmap.upcomingTasks?.[0]?.title).toBe('Multi-container Docker Compose');

      // Applications: 4 total (1 Saved, 1 Applied, 1 Assessment, 1 Interview)
      expect(data.applications.totalApplications).toBe(4);
      expect(data.applications.stageCounts.interview).toBe(1);
      expect(data.applications.stageCounts.assessment).toBe(1);
      expect(data.applications.stageCounts.applied).toBe(1);
      expect(data.applications.stageCounts.saved).toBe(1);

      // Response Rate: active applications = 4 - 1 (Saved) = 3; responded = 1 Assessment + 1 Interview = 2.
      // Rate = (2 / 3) * 100 = 66.7%
      expect(data.applications.responseRatePercentage).toBeCloseTo(66.7, 0);

      // Upcoming Interviews: should have TechFlow Systems
      expect(data.upcomingInterviews.length).toBe(1);
      expect(data.upcomingInterviews[0].company).toBe('TechFlow Systems');

      // Overdue Follow-ups: CloudNative Corp
      expect(data.pendingFollowUps.overdue.length).toBe(1);
      expect(data.pendingFollowUps.overdue[0].company).toBe('CloudNative Corp');

      // Interview sessions
      expect(data.recentInterviewPractice.length).toBe(1);
      expect(data.recentInterviewPractice[0].score).toBe(85);

      // Resume Analysis
      expect(data.resumeAnalysis.hasAnalysis).toBe(true);
      expect(data.resumeAnalysis.overallScore).toBe(88);

      // Recommended next actions synthesize actionable items
      expect(data.recommendedNextActions.length).toBeGreaterThan(0);
      const actionUrls = data.recommendedNextActions.map((a: { actionUrl: string }) => a.actionUrl);
      expect(actionUrls).toContain('/roadmap');
      expect(actionUrls).toContain('/applications');
    });
  });

  describe('3. In-App Notifications & Preference Engine', () => {
    let createdNotificationId = '';

    it('returns empty list and 0 unread count initially for user A', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data).toHaveLength(0);

      const countRes = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(countRes.status).toBe(200);
      expect(countRes.body.data.unreadCount).toBe(0);
    });

    it('syncs reminders and generates notification entries for upcoming interviews, follow-ups, and roadmap tasks', async () => {
      const syncRes = await request(app)
        .post('/api/notifications/sync-reminders')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(syncRes.status).toBe(200);
      expect(syncRes.body.success).toBe(true);
      expect(syncRes.body.data.createdCount).toBeGreaterThan(0);

      const listRes = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(listRes.status).toBe(200);
      const notifs = listRes.body.data;
      expect(Array.isArray(notifs)).toBe(true);
      expect(notifs.length).toBeGreaterThan(0);

      const types = notifs.map((n: { type: string }) => n.type);
      expect(types).toContain('interview');
      expect(types).toContain('follow_up');
      expect(types).toContain('roadmap_task');

      createdNotificationId = (notifs[0]._id || notifs[0].id).toString();
    });

    it('enforces idempotency and prevents duplicate notifications when synced again', async () => {
      const syncRes2 = await request(app)
        .post('/api/notifications/sync-reminders')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(syncRes2.status).toBe(200);
      // Because unique referenceId + referenceType prevents duplicates, createdCount should be 0!
      expect(syncRes2.body.data.createdCount).toBe(0);
    });

    it('marks a single notification as read', async () => {
      const patchRes = await request(app)
        .patch(`/api/notifications/${createdNotificationId}/read`)
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.data.read).toBe(true);
    });

    it('marks all remaining notifications as read', async () => {
      const markAllRes = await request(app)
        .patch('/api/notifications/mark-all-read')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(markAllRes.status).toBe(200);
      expect(markAllRes.body.data.modifiedCount).toBeGreaterThanOrEqual(0);

      const countRes = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(countRes.body.data.unreadCount).toBe(0);
    });

    it('deletes/dismisses a notification', async () => {
      const deleteRes = await request(app)
        .delete(`/api/notifications/${createdNotificationId}`)
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(deleteRes.status).toBe(200);

      // Verify it cannot be marked read after dismissal
      const patchAgain = await request(app)
        .patch(`/api/notifications/${createdNotificationId}/read`)
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(patchAgain.status).toBe(404);
    });

    it('retrieves and updates notification preferences', async () => {
      const getPrefRes = await request(app)
        .get('/api/notifications/preferences')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(getPrefRes.status).toBe(200);
      expect(getPrefRes.body.data.interviewReminders).toBe(true);
      expect(getPrefRes.body.data.followUpReminders).toBe(true);

      const updateRes = await request(app)
        .put('/api/notifications/preferences')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          interviewReminders: false,
          timeZone: 'Asia/Kolkata',
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.interviewReminders).toBe(false);
      expect(updateRes.body.data.timeZone).toBe('Asia/Kolkata');
    });
  });

  describe('4. Cross-User Privacy & Security Isolation', () => {
    it('prevents Student B from accessing Student A notifications', async () => {
      // User A creates a new notification
      const uAObjectId = new m.Types.ObjectId(userAId);
      const secretNotif = await Notification.create({
        user: uAObjectId,
        type: 'system',
        title: 'Confidential Alert For Student A',
        message: 'Personal scholarship details',
      });

      // User B tries to mark it as read
      const resRead = await request(app)
        .patch(`/api/notifications/${secretNotif._id.toString()}/read`)
        .set('Authorization', `Bearer ${tokenUserB}`);

      expect(resRead.status).toBe(403);

      // User B tries to delete it
      const resDel = await request(app)
        .delete(`/api/notifications/${secretNotif._id.toString()}`)
        .set('Authorization', `Bearer ${tokenUserB}`);

      expect(resDel.status).toBe(403);

      // Student B's dashboard summary shows no data from Student A
      const bSummary = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${tokenUserB}`);

      expect(bSummary.body.data.applications.totalApplications).toBe(0);
      expect(bSummary.body.data.careerAnalysis.hasAnalysis).toBe(false);
    });

    it('rejects unauthenticated requests to dashboard and notifications endpoints', async () => {
      const dashRes = await request(app).get('/api/dashboard/summary');
      expect(dashRes.status).toBe(401);

      const notifRes = await request(app).get('/api/notifications');
      expect(notifRes.status).toBe(401);

      const prefRes = await request(app).get('/api/notifications/preferences');
      expect(prefRes.status).toBe(401);
    });
  });
});
