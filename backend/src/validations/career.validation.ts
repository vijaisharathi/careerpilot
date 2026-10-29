import { z } from 'zod';

export const runAnalysisSchema = z.object({
  body: z.object({
    roleSlug: z.string().trim().min(1).optional(),
    roleId: z.string().trim().optional(),
  }),
});

export const careerAnalysisAiResponseSchema = z.object({
  executiveSummary: z.string().min(20),
  strengthsNarrative: z.string().min(20),
  gapAnalysisNarrative: z.string().min(20),
  tailoredProjects: z
    .array(
      z.object({
        title: z.string().min(2),
        description: z.string().min(10),
        skillsCovered: z.array(z.string()).default([]),
        impact: z.string().optional(),
      })
    )
    .min(1),
  tailoredCertifications: z
    .array(
      z.object({
        title: z.string().min(2),
        issuer: z.string().min(2),
        priority: z.enum(['High', 'Medium', 'Low']).default('High'),
        reason: z.string().optional(),
      })
    )
    .default([]),
  actionPlan: z
    .array(
      z.object({
        timeframe: z.string().min(2),
        objective: z.string().min(5),
        tasks: z.array(z.string()).min(1),
      })
    )
    .min(1),
});

export type CareerAnalysisAiResponse = z.infer<typeof careerAnalysisAiResponseSchema>;

