import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    fullName: z.string().trim().min(2, 'Name must be at least 2 characters').max(100).optional(),
    phone: z.string().trim().max(30).optional(),
    location: z.string().trim().max(100).optional(),
    headline: z.string().trim().max(200).optional(),
    bio: z.string().trim().max(2000).optional(),
    college: z.string().trim().max(200).optional(),
    degree: z.string().trim().max(100).optional(),
    department: z.string().trim().max(100).optional(),
    graduationYear: z.number().int().min(1980).max(2100).optional(),
    careerInterests: z
      .object({
        targetRoles: z.array(z.string().trim().min(1)).optional(),
        preferredLocations: z.array(z.string().trim().min(1)).optional(),
        preferredMode: z.enum(['Remote', 'Hybrid', 'On-site', 'Any']).optional(),
        careerGoals: z.string().trim().max(2000).optional(),
        targetCompensation: z.string().trim().max(100).optional(),
      })
      .optional(),
  }),
});

export const addSkillSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Skill name is required').max(100),
    category: z.enum(['languages', 'frameworks', 'databases', 'cloud', 'soft_skills'], {
      errorMap: () => ({ message: 'Category must be one of: languages, frameworks, databases, cloud, soft_skills' }),
    }),
    proficiency: z.enum(['Beginner', 'Intermediate', 'Advanced'], {
      errorMap: () => ({ message: 'Proficiency must be Beginner, Intermediate, or Advanced' }),
    }),
    verified: z.boolean().optional(),
  }),
});

export const updateSkillSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Skill ID is required'),
  }),
  body: z.object({
    name: z.string().trim().min(1).max(100).optional(),
    category: z.enum(['languages', 'frameworks', 'databases', 'cloud', 'soft_skills']).optional(),
    proficiency: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional(),
    verified: z.boolean().optional(),
  }),
});

export const addProjectSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1, 'Project title is required').max(150),
    technologies: z.array(z.string().trim().min(1)).default([]),
    link: z.string().trim().url('Link must be a valid URL').optional().or(z.literal('')),
    bullets: z.array(z.string().trim().min(1)).default([]),
  }),
});

export const updateProjectSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Project ID is required'),
  }),
  body: z.object({
    title: z.string().trim().min(1).max(150).optional(),
    technologies: z.array(z.string().trim()).optional(),
    link: z.string().trim().url('Link must be a valid URL').optional().or(z.literal('')),
    bullets: z.array(z.string().trim()).optional(),
  }),
});

export const addCertificationSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1, 'Certification title is required').max(150),
    issuer: z.string().trim().min(1, 'Issuer is required').max(150),
    issueDate: z.string().trim().min(1, 'Issue date is required').max(50),
    credentialUrl: z.string().trim().url('Credential URL must be valid').optional().or(z.literal('')),
  }),
});

export const updateCertificationSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Certification ID is required'),
  }),
  body: z.object({
    title: z.string().trim().min(1).max(150).optional(),
    issuer: z.string().trim().min(1).max(150).optional(),
    issueDate: z.string().trim().min(1).max(50).optional(),
    credentialUrl: z.string().trim().url('Credential URL must be valid').optional().or(z.literal('')),
  }),
});

export const addEducationSchema = z.object({
  body: z.object({
    institution: z.string().trim().min(1, 'Institution is required').max(200),
    degree: z.string().trim().min(1, 'Degree is required').max(100),
    field: z.string().trim().min(1, 'Field / major is required').max(100),
    startDate: z.string().trim().min(1, 'Start date is required').max(50),
    endDate: z.string().trim().min(1, 'End date is required').max(50),
    gpa: z.string().trim().max(20).optional(),
  }),
});

export const updateEducationSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Education ID is required'),
  }),
  body: z.object({
    institution: z.string().trim().min(1).max(200).optional(),
    degree: z.string().trim().min(1).max(100).optional(),
    field: z.string().trim().min(1).max(100).optional(),
    startDate: z.string().trim().min(1).max(50).optional(),
    endDate: z.string().trim().min(1).max(50).optional(),
    gpa: z.string().trim().max(20).optional(),
  }),
});

export const addExperienceSchema = z.object({
  body: z.object({
    role: z.string().trim().min(1, 'Role title is required').max(100),
    company: z.string().trim().min(1, 'Company is required').max(150),
    location: z.string().trim().max(100).optional(),
    startDate: z.string().trim().min(1, 'Start date is required').max(50),
    endDate: z.string().trim().min(1, 'End date is required').max(50),
    current: z.boolean().optional().default(false),
    bullets: z.array(z.string().trim().min(1)).default([]),
  }),
});

export const updateExperienceSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Experience ID is required'),
  }),
  body: z.object({
    role: z.string().trim().min(1).max(100).optional(),
    company: z.string().trim().min(1).max(150).optional(),
    location: z.string().trim().max(100).optional(),
    startDate: z.string().trim().min(1).max(50).optional(),
    endDate: z.string().trim().min(1).max(50).optional(),
    current: z.boolean().optional(),
    bullets: z.array(z.string().trim()).optional(),
  }),
});

