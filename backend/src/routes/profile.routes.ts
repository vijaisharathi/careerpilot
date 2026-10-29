import { Router } from 'express';
import { profileController } from '../controllers';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import {
  updateProfileSchema,
  addSkillSchema,
  updateSkillSchema,
  addProjectSchema,
  updateProjectSchema,
  addCertificationSchema,
  updateCertificationSchema,
  addEducationSchema,
  updateEducationSchema,
  addExperienceSchema,
  updateExperienceSchema,
} from '../validations/profile.validation';

const router = Router();

// Enforce authentication on all profile routes
router.use(authenticate);

// Profile base CRUD (supports both root and /me, PUT and PATCH)
router.get('/', profileController.getProfile);
router.get('/me', profileController.getProfile);
router.put('/', validateRequest(updateProfileSchema), profileController.updateProfile);
router.put('/me', validateRequest(updateProfileSchema), profileController.updateProfile);
router.patch('/', validateRequest(updateProfileSchema), profileController.updateProfile);
router.patch('/me', validateRequest(updateProfileSchema), profileController.updateProfile);

// Skills
router.post('/skills', validateRequest(addSkillSchema), profileController.addSkill);
router.put('/skills/:id', validateRequest(updateSkillSchema), profileController.updateSkill);
router.delete('/skills/:id', profileController.removeSkill);

// Projects
router.post('/projects', validateRequest(addProjectSchema), profileController.addProject);
router.put('/projects/:id', validateRequest(updateProjectSchema), profileController.updateProject);
router.delete('/projects/:id', profileController.removeProject);

// Certifications
router.post('/certifications', validateRequest(addCertificationSchema), profileController.addCertification);
router.put('/certifications/:id', validateRequest(updateCertificationSchema), profileController.updateCertification);
router.delete('/certifications/:id', profileController.removeCertification);

// Education
router.post('/education', validateRequest(addEducationSchema), profileController.addEducation);
router.put('/education/:id', validateRequest(updateEducationSchema), profileController.updateEducation);
router.delete('/education/:id', profileController.removeEducation);

// Experience
router.post('/experience', validateRequest(addExperienceSchema), profileController.addExperience);
router.put('/experience/:id', validateRequest(updateExperienceSchema), profileController.updateExperience);
router.delete('/experience/:id', profileController.removeExperience);

export default router;

