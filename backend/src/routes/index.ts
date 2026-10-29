import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import profileRoutes from './profile.routes';
import careerRoutes from './career.routes';
import roadmapRoutes from './roadmap.routes';
import jobRoutes from './job.routes';
import aiRoutes from './ai.routes';
import resumeRoutes from './resume.routes';
import interviewRoutes from './interview.routes';
import jobApplicationRoutes from './jobApplication.routes';
import dashboardRoutes from './dashboard.routes';
import notificationRoutes from './notification.routes';
import adminRoutes from './admin.routes';
import placementRoutes from './placement.routes';
import codingRoutes from './coding.routes';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/career', careerRoutes);
router.use('/roadmap', roadmapRoutes);
router.use('/jobs', jobRoutes);
router.use('/ai', aiRoutes);
router.use('/resumes', resumeRoutes);
router.use('/interviews', interviewRoutes);
router.use('/applications', jobApplicationRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);
router.use('/placement', placementRoutes);
router.use('/coding', codingRoutes);

export default router;
