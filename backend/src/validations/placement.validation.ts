import { z } from 'zod';

export const createDriveSchema = z.object({
  companyName: z
    .string({ required_error: 'Company name is required' })
    .min(2, 'Company name must be at least 2 characters')
    .max(120),
  driveTitle: z
    .string({ required_error: 'Drive title is required' })
    .min(3, 'Drive title must be at least 3 characters')
    .max(200),
  jobRole: z
    .string({ required_error: 'Job role is required' })
    .min(2, 'Job role must be at least 2 characters')
    .max(120),
  jobDescription: z
    .string({ required_error: 'Job description is required' })
    .min(10, 'Job description must be at least 10 characters'),
  requiredSkills: z.array(z.string()).default([]),
  eligibilityCriteria: z
    .object({
      eligibleDepartments: z.array(z.string()).default([]),
      eligibleGraduationYears: z.array(z.number()).default([]),
      minGpa: z.number().min(0).max(10).optional(),
      minReadinessScore: z.number().min(0).max(100).optional(),
      minProfileCompletion: z.number().min(0).max(100).optional(),
      requiredSkillsMustMatch: z.boolean().optional(),
    })
    .default({ eligibleDepartments: [], eligibleGraduationYears: [] }),
  openingsCount: z.number().min(1).optional(),
  location: z.string({ required_error: 'Location is required' }).min(2),
  employmentType: z.enum(['Full-time', 'Internship', 'Co-op', 'Contract']).default('Full-time'),
  workMode: z.enum(['On-site', 'Hybrid', 'Remote']).default('On-site'),
  compensation: z
    .object({
      amount: z.string().default(''),
      period: z.enum(['yearly', 'monthly', 'hourly']).default('yearly'),
      currency: z.string().default('USD'),
    })
    .optional(),
  registrationStartDate: z.string().or(z.date()).default(() => new Date()),
  registrationDeadline: z.string().or(z.date()),
  assessmentDate: z.string().or(z.date()).optional(),
  interviewDates: z.array(z.string().or(z.date())).optional(),
  applicationUrl: z
    .string()
    .url('Invalid URL format')
    .refine((url) => /^https?:\/\//i.test(url), {
      message: 'Application URL must begin with http:// or https://',
    })
    .optional()
    .or(z.literal('')),
  status: z
    .enum([
      'draft',
      'published',
      'registration_open',
      'registration_closed',
      'in_progress',
      'completed',
      'cancelled',
    ])
    .default('draft'),
});

export const updateDriveSchema = createDriveSchema.partial();

export const changeDriveStatusSchema = z.object({
  status: z.enum(
    [
      'draft',
      'published',
      'registration_open',
      'registration_closed',
      'in_progress',
      'completed',
      'cancelled',
    ],
    { required_error: 'Valid drive status is required' }
  ),
});

export const updateCandidateStageSchema = z.object({
  stage: z.enum(
    [
      'registered',
      'shortlisted',
      'assessment',
      'interview',
      'selected',
      'offered',
      'accepted',
      'rejected',
      'withdrawn',
    ],
    { required_error: 'Valid recruitment stage is required' }
  ),
  comment: z.string().optional(),
  offerDetails: z
    .object({
      salary: z.string().optional(),
      designation: z.string().optional(),
      offerLetterUrl: z.string().optional(),
      terms: z.string().optional(),
    })
    .optional(),
});

export const overrideEligibilitySchema = z.object({
  status: z.enum(['eligible', 'not_eligible', 'needs_review'], {
    required_error: 'Valid eligibility status is required',
  }),
  reason: z
    .string({ required_error: 'An explicit override reason is mandatory' })
    .min(5, 'Override reason must be at least 5 characters long'),
});

export const createAnnouncementSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .min(3, 'Title must be at least 3 characters')
    .max(200),
  content: z
    .string({ required_error: 'Content is required' })
    .min(5, 'Content must be at least 5 characters'),
  relatedDriveId: z.string().optional(),
  targetDepartments: z.array(z.string()).default([]),
  targetGraduationYears: z.array(z.number()).default([]),
  publicationDate: z.string().or(z.date()).optional(),
  expirationDate: z.string().or(z.date()).optional(),
});

export const provisionPlacementOfficerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please provide a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  institutionId: z.string().optional(),
  department: z.string().optional(),
});

