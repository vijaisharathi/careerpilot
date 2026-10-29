import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import m from 'mongoose';
import app from '../src/app';
import { User } from '../src/models/user.model';
import { StudentProfile } from '../src/models/studentProfile.model';
import { CareerAnalysis } from '../src/models/careerAnalysis.model';
import { LearningRoadmap } from '../src/models/learningRoadmap.model';
import { JobOpportunity } from '../src/models/jobOpportunity.model';
import { SavedJob } from '../src/models/savedJob.model';
import { JobApplication } from '../src/models/jobApplication.model';
import { InterviewSession } from '../src/models/interviewSession.model';
import { ResumeDocument } from '../src/models/resumeDocument.model';
import { ResumeAnalysis } from '../src/models/resumeAnalysis.model';
import { Notification } from '../src/models/notification.model';
import { NotificationPreference } from '../src/models/notificationPreference.model';
import { AssistantConversation } from '../src/models/assistantConversation.model';

const TEST_DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/career_pilot_ai_test';

describe('Comprehensive End-to-End Student Placement Journey (16 Steps)', () => {
  let accessToken = '';
  let refreshToken = '';
  let userId = '';
  let profileId = '';
  let firstJobId = '';
  let roadmapId = '';
  let firstTaskId = '';
  let resumeId = '';
  let interviewSessionId = '';
  let applicationId = '';
  let notificationId = '';

  const testStudent = {
    name: 'Vikram Aditya',
    email: 'vikram.aditya@e2etest.com',
    password: 'SecurePlacement2026!',
    role: 'student',
  };

  beforeAll(async () => {
    if (m.connection.readyState === 0) {
      await m.connect(TEST_DB_URI);
    }
    const existing = await User.findOne({ email: testStudent.email });
    if (existing) {
      const uId = existing._id;
      await User.deleteOne({ _id: uId });
      await StudentProfile.deleteMany({ user: uId });
      await CareerAnalysis.deleteMany({ user: uId });
      await LearningRoadmap.deleteMany({ user: uId });
      await SavedJob.deleteMany({ user: uId });
      await JobApplication.deleteMany({ user: uId });
      await InterviewSession.deleteMany({ user: uId });
      await ResumeDocument.deleteMany({ user: uId });
      await ResumeAnalysis.deleteMany({ user: uId });
      await Notification.deleteMany({ user: uId });
      await NotificationPreference.deleteMany({ user: uId });
      await AssistantConversation.deleteMany({ user: uId });
    }
  });

  afterAll(async () => {
    if (userId) {
      const uId = new m.Types.ObjectId(userId);
      await User.deleteOne({ _id: uId });
      await StudentProfile.deleteMany({ user: uId });
      await CareerAnalysis.deleteMany({ user: uId });
      await LearningRoadmap.deleteMany({ user: uId });
      await SavedJob.deleteMany({ user: uId });
      await JobApplication.deleteMany({ user: uId });
      await InterviewSession.deleteMany({ user: uId });
      await ResumeDocument.deleteMany({ user: uId });
      await ResumeAnalysis.deleteMany({ user: uId });
      await Notification.deleteMany({ user: uId });
      await NotificationPreference.deleteMany({ user: uId });
      await AssistantConversation.deleteMany({ user: uId });
    }
  });

  // Step 1: Register and Log In
  it('Step 1: Student registers and logs in with JWT tokens', async () => {
    // 1a. Register
    const regRes = await request(app).post('/api/auth/register').send(testStudent);
    expect(regRes.status).toBe(201);
    expect(regRes.body.success).toBe(true);
    expect(regRes.body.data.user.email).toBe(testStudent.email);
    userId = (regRes.body.data.user.id || regRes.body.data.user._id).toString();

    // 1b. Log in
    const loginRes = await request(app).post('/api/auth/login').send({
      email: testStudent.email,
      password: testStudent.password,
    });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.tokens.accessToken).toBeDefined();
    expect(loginRes.body.data.tokens.refreshToken).toBeDefined();

    accessToken = loginRes.body.data.tokens.accessToken;
    refreshToken = loginRes.body.data.tokens.refreshToken;

    // Verify /api/auth/me
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(meRes.status).toBe(200);
    const meUserId = (meRes.body.data.user.id || meRes.body.data.user._id).toString();
    expect(meUserId).toBe(userId);
    profileId = (meRes.body.data.profile.id || meRes.body.data.profile._id).toString();
  });

  // Step 2 & 3: Complete Student Profile (Education, Skills, Projects, Goals)
  it('Steps 2 & 3: Student completes profile with education, skills, projects, and goals', async () => {
    // Update basic profile and education
    const updateRes = await request(app)
      .patch('/api/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        college: 'National Institute of Technology, Trichy',
        degree: 'B.Tech',
        department: 'Computer Science and Engineering',
        graduationYear: 2026,
        headline: 'Aspiring Full Stack Cloud Engineer',
        location: 'Bengaluru, India',
        careerInterests: {
          targetRoles: ['Full-Stack Developer', 'Backend Developer'],
          preferredLocations: ['Bengaluru', 'Remote'],
          preferredMode: 'Remote',
          careerGoals: 'Build high-throughput distributed systems in tier-1 product startups',
        },
      });
    expect(updateRes.status).toBe(200);
    const updatedProfile = updateRes.body.data.profile || updateRes.body.data;
    expect(updatedProfile.college).toBe('National Institute of Technology, Trichy');

    // Add skills
    const skillRes = await request(app)
      .post('/api/profile/skills')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'TypeScript',
        category: 'languages',
        proficiency: 'Advanced',
      });
    expect(skillRes.status).toBe(201);

    await request(app)
      .post('/api/profile/skills')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'React',
        category: 'frameworks',
        proficiency: 'Advanced',
      });

    await request(app)
      .post('/api/profile/skills')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Node.js',
        category: 'frameworks',
        proficiency: 'Intermediate',
      });

    // Add project
    const projRes = await request(app)
      .post('/api/profile/projects')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Distributed Log Streaming Pipeline',
        technologies: ['TypeScript', 'Node.js', 'PostgreSQL'],
        bullets: ['Processed 10,000 req/sec with sub-50ms latency'],
      });
    expect(projRes.status).toBe(201);

    // Verify profile completion re-computed
    const profileRes = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(profileRes.status).toBe(200);
    const finalProfile = profileRes.body.data.profile || profileRes.body.data;
    expect(finalProfile.completionPercentage).toBeGreaterThan(60);
    expect(finalProfile.skills.length).toBe(3);
  });

  // Step 4: Run Career Analysis
  it('Step 4: Student runs Career Fit Analysis for target role', async () => {
    const analysisRes = await request(app)
      .post('/api/career/analyze')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        roleSlug: 'full-stack-developer',
      });

    expect([200, 201]).toContain(analysisRes.status);
    expect(analysisRes.body.success).toBe(true);
    const analysisData = analysisRes.body.data.analysis || analysisRes.body.data;
    expect(analysisData.targetRole.slug).toBe('full-stack-developer');
    expect(typeof analysisData.scores.readinessScore).toBe('number');
    expect(typeof analysisData.scores.skillMatchScore).toBe('number');
    expect(analysisData.matchedSkills.length).toBeGreaterThan(0);
  });

  // Step 5: Review Skill Gaps
  it('Step 5: Student reviews identified Skill Gaps and requirements', async () => {
    const historyRes = await request(app)
      .get('/api/career/analyses')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(historyRes.status).toBe(200);
    const historyList = historyRes.body.data.history || historyRes.body.data;
    expect(historyList.length).toBeGreaterThan(0);
    const latest = historyList[0];
    expect(latest.missingSkills).toBeDefined();
    expect(Array.isArray(latest.missingSkills)).toBe(true);
  });

  // Step 6: Generate Personalized Learning Roadmap
  it('Step 6: Student generates structured Personalized Learning Roadmap', async () => {
    const roadmapRes = await request(app)
      .post('/api/roadmap/generate')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        roleSlug: 'full-stack-developer',
        weeklyHours: 12,
        totalWeeks: 8,
      });

    expect(roadmapRes.status).toBe(201);
    expect(roadmapRes.body.success).toBe(true);
    const rm = roadmapRes.body.data;
    roadmapId = rm._id;
    expect(rm.phases.length).toBeGreaterThan(0);
    expect(rm.totalTasks).toBeGreaterThan(0);
    expect(rm.overallProgress).toBe(0);

    firstTaskId = rm.phases[0].weeks[0].tasks[0]._id;
    expect(firstTaskId).toBeDefined();
  });

  // Step 7: Update Learning Progress
  it('Step 7: Student completes a task and dynamically recalculates roadmap progress', async () => {
    const taskRes = await request(app)
      .patch(`/api/roadmap/tasks/${firstTaskId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ completed: true });

    expect(taskRes.status).toBe(200);
    expect(taskRes.body.data.completedTasks).toBe(1);
    expect(taskRes.body.data.overallProgress).toBeGreaterThan(0);
  });

  // Step 8: Search and Filter Jobs
  it('Step 8: Student searches and filters placement opportunities', async () => {
    const searchRes = await request(app)
      .get('/api/jobs?keyword=Developer&page=1&limit=5')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(searchRes.status).toBe(200);
    expect(searchRes.body.data.opportunities.length).toBeGreaterThan(0);
    firstJobId = searchRes.body.data.opportunities[0]._id;
    expect(firstJobId).toBeDefined();
  });

  // Step 9: View Matching Explanations
  it('Step 9: Student views job details with deterministic profile match explanation', async () => {
    const detailRes = await request(app)
      .get(`/api/jobs/${firstJobId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(detailRes.status).toBe(200);
    expect(detailRes.body.data.job._id).toBe(firstJobId);
    expect(detailRes.body.data.job.match).toBeDefined();
    expect(typeof (detailRes.body.data.job.match.matchScore ?? detailRes.body.data.job.match.overallMatchScore)).toBe('number');
  });

  // Step 10: Save an Opportunity
  it('Step 10: Student bookmarks / saves an opportunity for future application', async () => {
    const saveRes = await request(app)
      .post(`/api/jobs/${firstJobId}/save`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ notes: 'Applied via campus placement drive' });

    expect([200, 201]).toContain(saveRes.status);

    const savedListRes = await request(app)
      .get('/api/jobs/saved')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(savedListRes.status).toBe(200);
    const savedJobs = savedListRes.body.data.savedJobs || savedListRes.body.data;
    const savedIds = savedJobs.map((s: { job: { _id: string } }) => s.job._id);
    expect(savedIds).toContain(firstJobId);
  });

  // Step 11: Create and Analyze a Resume
  it('Step 11: Student creates resume from profile and runs ATS criteria analysis', async () => {
    // 11a. Populate resume from profile
    const resumeRes = await request(app)
      .post('/api/resumes/import-profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Full Stack Engineering Resume',
        targetRole: 'Full-Stack Developer',
      });

    expect(resumeRes.status).toBe(201);
    resumeId = resumeRes.body.data._id;
    expect(resumeId).toBeDefined();

    // 11b. Run ATS analysis against job description
    const atsRes = await request(app)
      .post('/api/resumes/analyze')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        resumeId,
        targetJobTitle: 'Full-Stack Developer',
        targetJobDescription:
          'Seeking a Full Stack Software Engineer proficient in React, TypeScript, Node.js, and scalable APIs.',
      });

    expect(atsRes.status).toBe(200);
    expect(atsRes.body.data.scores.overallScore).toBeGreaterThan(50);
    expect(atsRes.body.data.matchedKeywords).toContain('TypeScript');
  });

  // Step 12: Complete a Mock Interview
  it('Step 12: Student initializes mock interview, submits answers, and receives criteria feedback', async () => {
    // 12a. Initialize session
    const sessionRes = await request(app)
      .post('/api/interviews')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        targetRole: 'Full Stack Developer',
        interviewType: 'technical',
        difficulty: 'Intermediate',
        questionCount: 1,
        topics: ['React', 'Node.js'],
      });

    expect(sessionRes.status).toBe(201);
    interviewSessionId = sessionRes.body.data._id;
    expect(interviewSessionId).toBeDefined();
    expect(sessionRes.body.data.questions.length).toBe(1);

    // 12b. Submit answer (completes session when all questions are answered)
    const answerRes = await request(app)
      .post(`/api/interviews/${interviewSessionId}/answers`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        questionIndex: 0,
        studentAnswer:
          'In React, the Virtual DOM is a lightweight in-memory representation of the actual DOM tree. When component state changes, React performs reconciliation using the Fiber architecture diffing algorithm to compute the minimal set of changes and batches updates efficiently to prevent costly browser DOM reflows and repaints.',
      });

    expect(answerRes.status).toBe(200);
    const evalScore =
      answerRes.body.data.evaluation?.overallScore ??
      answerRes.body.data.questions?.[0]?.evaluation?.overallScore ??
      answerRes.body.data.summary?.overallScore;
    expect(evalScore).toBeGreaterThan(50);
    expect(answerRes.body.data.status).toBe('completed');
  });

  // Step 13: Create and Update an Application
  it('Step 13: Student adds job application, transitions stages, and sets upcoming interview', async () => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 4);

    const createRes = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        company: 'Stripe Global India',
        jobTitle: 'Software Engineer - Platform',
        applicationUrl: 'https://stripe.com/jobs/123',
        status: 'Interview',
        interviewDate: nextWeek.toISOString(),
        notes: 'Technical architecture round scheduled',
      });

    expect(createRes.status).toBe(201);
    applicationId = createRes.body.data._id;
    expect(applicationId).toBeDefined();

    // Update follow-up date
    const followDate = new Date();
    followDate.setDate(followDate.getDate() + 2);

    const updateRes = await request(app)
      .patch(`/api/applications/${applicationId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        followUpDate: followDate.toISOString(),
        notes: 'Round 1 technical phone screen completed.',
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.notes).toBe('Round 1 technical phone screen completed.');
  });

  // Step 14: Review Dashboard Metrics
  it('Step 14: Student reviews aggregated Dashboard metrics reflecting real database records', async () => {
    const dashRes = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(dashRes.status).toBe(200);
    const data = dashRes.body.data;

    // Profile verification
    expect(data.profile.name).toBe(testStudent.name);
    expect(data.profile.completionPercentage).toBeGreaterThan(60);

    // Career analysis verification
    expect(data.careerAnalysis.hasAnalysis).toBe(true);
    expect(data.careerAnalysis.targetRole).toBe('Full-Stack Developer');

    // Roadmap verification
    expect(data.roadmap.hasRoadmap).toBe(true);
    expect(data.roadmap.completedTasks).toBe(1);

    // Application tracker verification
    expect(data.applications.totalApplications).toBe(1);
    expect(data.applications.stageCounts.interview).toBe(1);
    expect(data.upcomingInterviews.length).toBe(1);
    expect(data.upcomingInterviews[0].company).toBe('Stripe Global India');

    // Recent interview practice verification
    expect(data.recentInterviewPractice.length).toBe(1);
    expect(data.recentInterviewPractice[0].score).toBeGreaterThan(50);

    // Resume audit verification
    expect(data.resumeAnalysis.hasAnalysis).toBe(true);

    // Recommended actions synthesized
    expect(data.recommendedNextActions.length).toBeGreaterThan(0);
  });

  // Step 15: Receive and Manage Notifications
  it('Step 15: Student synchronizes and manages in-app notifications and preferences', async () => {
    // 15a. Sync in-app reminders
    const syncRes = await request(app)
      .post('/api/notifications/sync-reminders')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(syncRes.status).toBe(200);
    expect(syncRes.body.data.createdCount).toBeGreaterThan(0);

    // 15b. Retrieve list
    const notifsRes = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(notifsRes.status).toBe(200);
    expect(notifsRes.body.data.length).toBeGreaterThan(0);
    notificationId = notifsRes.body.data[0]._id;

    // 15c. Mark read
    const readRes = await request(app)
      .patch(`/api/notifications/${notificationId}/read`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(readRes.status).toBe(200);
    expect(readRes.body.data.read).toBe(true);

    // 15d. Dismiss notification
    const dismissRes = await request(app)
      .delete(`/api/notifications/${notificationId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(dismissRes.status).toBe(200);
  });

  // Step 16: Use AI Career Assistant
  it('Step 16: Student chats with AI Career Assistant receiving context-aware recommendations', async () => {
    const chatRes = await request(app)
      .post('/api/ai/assistant/chat')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        message: 'How should I prepare for my upcoming Stripe full-stack interview?',
      });

    expect(chatRes.status).toBe(200);
    expect(chatRes.body.success).toBe(true);
    const chatData = chatRes.body.data;

    expect(chatData.conversationId).toBeDefined();
    expect(chatData.message.content.length).toBeGreaterThan(20);
    expect(chatData.recommendations.length).toBeGreaterThan(0);
    expect(chatData.suggestedFollowUps.length).toBeGreaterThan(0);

    // Verify conversation was persisted
    const listConvRes = await request(app)
      .get('/api/ai/assistant/conversations')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(listConvRes.status).toBe(200);
    expect(listConvRes.body.data.length).toBeGreaterThan(0);
    const firstConvId = listConvRes.body.data[0].id || listConvRes.body.data[0]._id;
    expect(firstConvId).toBe(chatData.conversationId);
  });
});
