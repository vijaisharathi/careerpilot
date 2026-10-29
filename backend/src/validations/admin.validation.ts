import { z } from 'zod';

export const updateStudentStatusSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Student ID is required'),
  }),
  body: z.object({
    status: z.enum(['active', 'suspended']),
    reason: z.string().max(500).optional(),
  }),
});

export const provisionAdminSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters long').max(100),
    email: z.string().trim().email('Please provide a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
  }),
});

export const adminJobQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    search: z.string().optional(),
    status: z.enum(['all', 'draft', 'published', 'active', 'expired', 'archived']).optional(),
    employmentType: z.string().optional(),
    workMode: z.string().optional(),
  }),
});

export const createAdminJobSchema = z.object({
  body: z.object({
    title: z.string().trim().min(3, 'Title must be at least 3 characters'),
    company: z.string().trim().min(2, 'Company must be at least 2 characters'),
    description: z.string().min(20, 'Description must be at least 20 characters'),
    roleCategory: z.string().trim().min(2, 'Role category is required'),
    employmentType: z.enum(['Full-time', 'Internship', 'Co-op', 'Contract']),
    workMode: z.enum(['Remote', 'Hybrid', 'On-site']),
    location: z.string().trim().min(2, 'Location is required'),
    compensation: z.object({
      amount: z.string().trim().min(1, 'Amount is required'),
      currency: z.string().default('USD'),
      period: z.enum(['yearly', 'monthly', 'hourly']).default('yearly'),
    }),
    experienceRequirements: z.object({
      minYears: z.number().min(0).default(0),
      level: z.enum(['Entry-Level', 'Internship', 'Associate', 'Mid-Level']).default('Entry-Level'),
    }),
    requiredSkills: z
      .array(
        z.object({
          name: z.string().trim().min(1),
          minProficiency: z.enum(['Beginner', 'Intermediate', 'Advanced']).default('Intermediate'),
          importance: z.enum(['critical', 'recommended']).default('critical'),
          weight: z.number().min(1).max(5).default(3),
        })
      )
      .default([]),
    preferredSkills: z.array(z.string()).default([]),
    applicationUrl: z
      .string()
      .trim()
      .url('Application URL must be a valid URL')
      .refine(
        (url) => url.startsWith('http://') || url.startsWith('https://'),
        'Application URL must begin with http:// or https://'
      ),
    source: z.string().default('Campus Placement Portal'),
    dataSourceType: z.enum(['seed_demonstration', 'verified_api', 'campus_partner']).default('campus_partner'),
    isVerifiedVacancy: z.boolean().default(true),
    status: z.enum(['draft', 'published', 'active', 'expired', 'archived']).default('published'),
    publicationDate: z.string().datetime().optional(),
    applicationDeadline: z.string().datetime().nullable().optional(),
  }),
});

export const createAdminRoleSchema = z.object({
  body: z.object({
    title: z.string().trim().min(2, 'Role title is required'),
    slug: z.string().trim().min(2).optional(),
    category: z.string().trim().min(2, 'Category is required'),
    description: z.string().trim().min(10, 'Description is required'),
    averageSalary: z
      .object({
        entry: z.string().default('$80,000 - $110,000'),
        mid: z.string().default('$120,000 - $160,000'),
        currency: z.string().default('USD'),
      })
      .optional(),
    marketDemand: z.enum(['Extremely High', 'High', 'Moderate']).default('High'),
    growthOutlook: z.string().default('+15% YoY'),
    requiredSkills: z
      .array(
        z.object({
          name: z.string().trim().min(1),
          category: z.enum(['languages', 'frameworks', 'databases', 'cloud', 'soft_skills']),
          minProficiency: z.enum(['Beginner', 'Intermediate', 'Advanced']).default('Intermediate'),
          importance: z.enum(['critical', 'recommended']).default('critical'),
          weight: z.number().min(1).max(5).default(3),
        })
      )
      .default([]),
    isActive: z.boolean().default(true),
  }),
});

export const createLearningResourceSchema = z.object({
  body: z.object({
    title: z.string().trim().min(3, 'Title is required'),
    description: z.string().trim().min(5, 'Description is required'),
    topic: z.string().trim().min(2, 'Topic is required'),
    relatedSkill: z.string().trim().min(1, 'Related skill is required'),
    resourceUrl: z
      .string()
      .trim()
      .url('Resource URL must be a valid URL')
      .refine(
        (url) => url.startsWith('http://') || url.startsWith('https://'),
        'Resource URL must begin with http:// or https://'
      ),
    resourceType: z.enum([
      'Official Documentation',
      'Tutorial',
      'Interactive Course',
      'Guide',
      'Practice Platform',
      'Cheat Sheet',
      'Video Course',
      'Book',
    ]),
    difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced', 'All Levels']).default('All Levels'),
    estimatedDurationMinutes: z.number().min(5).default(60),
    publicationStatus: z.enum(['draft', 'published', 'archived']).default('published'),
    isFree: z.boolean().default(true),
    provider: z.string().trim().min(2, 'Provider is required'),
    isVerified: z.boolean().default(true),
  }),
});

export const updatePlatformSettingsSchema = z.object({
  body: z.object({
    platformName: z.string().trim().min(2).max(100).optional(),
    supportEmail: z.string().trim().email().optional(),
    jobPublicationRules: z
      .object({
        requireAdminApproval: z.boolean().optional(),
        autoArchiveExpiredDays: z.number().min(1).optional(),
        allowStudentSubmissions: z.boolean().optional(),
      })
      .optional(),
    learningResourceVisibility: z
      .object({
        requireVerificationToPublish: z.boolean().optional(),
        showFreeOnlyByDefault: z.boolean().optional(),
      })
      .optional(),
    notificationPreferences: z
      .object({
        notifyOnNewRegistrations: z.boolean().optional(),
        notifyOnJobApplicationSubmissions: z.boolean().optional(),
      })
      .optional(),
    systemNotice: z.string().max(1000).optional(),
  }),
});

