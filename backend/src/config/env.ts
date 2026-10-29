import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('5000'),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/career_pilot_ai'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET should be at least 16 characters long').default('dev_jwt_secret_career_pilot_ai_2026_default_key'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET should be at least 16 characters long').default('dev_jwt_refresh_secret_career_pilot_ai_2026_refresh_key'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  AI_PROVIDER: z.enum(['mock', 'gemini', 'openai']).default('mock'),
  GEMINI_API_KEY: z.string().optional().default(''),
  OPENAI_API_KEY: z.string().optional().default(''),
  CODE_EXECUTION_PROVIDER: z.enum(['mock', 'judge0', 'piston']).default('mock'),
  JUDGE0_API_URL: z.string().optional().default(''),
  JUDGE0_API_KEY: z.string().optional().default(''),
  PISTON_API_URL: z.string().optional().default(''),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errorDetails = result.error.format();
    console.error('Invalid environment variables configuration:', JSON.stringify(errorDetails, null, 2));
    throw new Error('Environment configuration validation failed');
  }

  return result.data;
};

export const env = parseEnv();
export type Environment = z.infer<typeof envSchema>;
