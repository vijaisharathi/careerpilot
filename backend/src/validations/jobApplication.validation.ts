import { z } from 'zod';

export const createApplicationSchema = z.object({
  body: z
    .object({
      company: z.string().trim().optional(),
      jobTitle: z.string().trim().optional(),
      jobOpportunity: z.string().trim().optional(),
      applicationUrl: z
        .string()
        .trim()
        .url('Must be a valid URL')
        .refine((url) => /^https?:\/\//i.test(url), 'Must be an HTTP or HTTPS URL')
        .optional()
        .or(z.literal('')),
      status: z
        .enum(['Saved', 'Applied', 'Assessment', 'Interview', 'Offer', 'Rejected', 'Withdrawn'])
        .optional()
        .default('Applied'),
      appliedDate: z.string().optional().nullable(),
      interviewDate: z.string().optional().nullable(),
      deadline: z.string().optional().nullable(),
      followUpDate: z.string().optional().nullable(),
      notes: z.string().trim().max(5000).optional(),
      location: z.string().trim().max(150).optional(),
      employmentType: z.string().trim().max(100).optional(),
      workMode: z.string().trim().max(100).optional(),
      compensation: z.string().trim().max(100).optional(),
    })
    .refine(
      (data) => {
        if (data.jobOpportunity) return true;
        return (
          !!data.company &&
          data.company.trim().length > 0 &&
          !!data.jobTitle &&
          data.jobTitle.trim().length > 0
        );
      },
      {
        message: 'Company and Job Title are required when not linking an existing opportunity',
        path: ['company'],
      }
    ),
});

export const updateApplicationSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1, 'Application ID is required'),
  }),
  body: z.object({
    company: z.string().trim().min(1).optional(),
    jobTitle: z.string().trim().min(1).optional(),
    applicationUrl: z
      .string()
      .trim()
      .url('Must be a valid URL')
      .refine((url) => /^https?:\/\//i.test(url), 'Must be an HTTP or HTTPS URL')
      .optional()
      .or(z.literal('')),
    status: z
      .enum(['Saved', 'Applied', 'Assessment', 'Interview', 'Offer', 'Rejected', 'Withdrawn'])
      .optional(),
    appliedDate: z.string().optional().nullable(),
    interviewDate: z.string().optional().nullable(),
    deadline: z.string().optional().nullable(),
    followUpDate: z.string().optional().nullable(),
    notes: z.string().trim().max(5000).optional(),
    location: z.string().trim().max(150).optional(),
    employmentType: z.string().trim().max(100).optional(),
    workMode: z.string().trim().max(100).optional(),
    compensation: z.string().trim().max(100).optional(),
  }),
});

export const queryApplicationsSchema = z.object({
  query: z.object({
    status: z
      .enum(['all', 'Saved', 'Applied', 'Assessment', 'Interview', 'Offer', 'Rejected', 'Withdrawn'])
      .optional()
      .default('all'),
    search: z.string().trim().optional(),
    sortBy: z
      .enum(['appliedDate', 'deadline', 'interviewDate', 'updatedAt', 'company'])
      .optional()
      .default('appliedDate'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
});

export const applicationIdSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1, 'Application ID is required'),
  }),
});

export type CreateApplicationBody = z.infer<typeof createApplicationSchema>['body'];
export type UpdateApplicationBody = z.infer<typeof updateApplicationSchema>['body'];
export type QueryApplicationsQuery = z.infer<typeof queryApplicationsSchema>['query'];

