import { z } from 'zod';

const templateEnum = z.enum([
  'modern-clean',
  'technical-classic',
  'minimalist-executive',
  'academic-research',
]);

const personalInfoSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().max(30).optional().default(''),
  location: z.string().max(100).optional().default(''),
  headline: z.string().max(150).optional().default(''),
  summary: z.string().max(2000).optional().default(''),
  linkedin: z.string().max(250).optional().default(''),
  github: z.string().max(250).optional().default(''),
  portfolio: z.string().max(250).optional().default(''),
});

const educationItemSchema = z.object({
  institution: z.string().min(1, 'Institution is required').max(150),
  degree: z.string().min(1, 'Degree is required').max(100),
  field: z.string().min(1, 'Field is required').max(100),
  startDate: z.string().min(1).max(30),
  endDate: z.string().min(1).max(30),
  gpa: z.string().max(20).optional().default(''),
  honors: z.string().max(100).optional().default(''),
});

const experienceItemSchema = z.object({
  role: z.string().min(1, 'Role is required').max(100),
  company: z.string().min(1, 'Company is required').max(100),
  location: z.string().max(100).optional().default(''),
  startDate: z.string().min(1).max(30),
  endDate: z.string().min(1).max(30),
  current: z.boolean().default(false),
  bullets: z.array(z.string().max(1000)).default([]),
});

const projectItemSchema = z.object({
  title: z.string().min(1, 'Project title is required').max(100),
  technologies: z.array(z.string().max(50)).default([]),
  link: z.string().max(250).optional().default(''),
  bullets: z.array(z.string().max(1000)).default([]),
});

const skillItemSchema = z.object({
  name: z.string().min(1, 'Skill name is required').max(50),
  category: z.enum(['languages', 'frameworks', 'databases', 'cloud', 'soft_skills', 'tools']).default('languages'),
  proficiency: z.enum(['Beginner', 'Intermediate', 'Advanced']).default('Intermediate'),
});

const certificationItemSchema = z.object({
  title: z.string().min(1, 'Title is required').max(120),
  issuer: z.string().min(1, 'Issuer is required').max(100),
  issueDate: z.string().min(1).max(30),
  credentialUrl: z.string().max(250).optional().default(''),
});

const createResumeDataSchema = z.object({
  title: z.string().min(1).max(120).optional().default('My Resume'),
  targetRole: z.string().max(100).optional().default(''),
  jobId: z.string().optional(),
  templateId: templateEnum.optional().default('modern-clean'),
  sectionOrder: z.array(z.string()).optional(),
  personalInfo: personalInfoSchema.optional(),
  education: z.array(educationItemSchema).optional(),
  experience: z.array(experienceItemSchema).optional(),
  projects: z.array(projectItemSchema).optional(),
  skills: z.array(skillItemSchema).optional(),
  certifications: z.array(certificationItemSchema).optional(),
});

export const createResumeSchema = z.object({
  body: createResumeDataSchema,
});

export const updateResumeSchema = z.object({
  body: createResumeDataSchema.partial(),
});

export const populateFromProfileSchema = z.object({
  body: z.object({
    templateId: templateEnum.optional().default('modern-clean'),
    targetRole: z.string().max(100).optional(),
  }),
});

export const createVariantSchema = z.object({
  body: z.object({
    targetRole: z.string().min(2, 'Target role is required').max(100),
    jobId: z.string().optional(),
  }),
});

export const applyBulletSchema = z.object({
  body: z.object({
    original: z.string().min(5, 'Original bullet is required'),
    suggested: z.string().min(5, 'Suggested bullet is required'),
  }),
});
