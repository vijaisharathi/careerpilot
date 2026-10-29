import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters long').max(100),
    email: z.string().trim().email('Please provide a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    role: z.enum(['student', 'mentor', 'placement_officer', 'admin']).optional().default('student'),
    profile: z
      .object({
        college: z.string().optional(),
        university: z.string().optional(),
        degree: z.string().optional(),
        department: z.string().optional(),
        graduationYear: z.number().int().min(1980).max(2100).optional(),
        skills: z.array(z.string()).optional(),
        targetRoles: z.array(z.string()).optional(),
        bio: z.string().max(1000).optional(),
      })
      .optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email('Please provide a valid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

export const logoutSchema = z.object({
  body: z
    .object({
      refreshToken: z.string().optional(),
    })
    .optional(),
});
