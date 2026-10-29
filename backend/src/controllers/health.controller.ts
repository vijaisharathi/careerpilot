import { Request, Response } from 'express';
import { getMongoConnectionState } from '../config/database';
import { env } from '../config/env';
import { sendSuccess } from '../utils/apiResponse';
import { llmService } from '../services/ai/llm.service';

export const getHealth = (_req: Request, res: Response): void => {
  const mongoStatus = getMongoConnectionState();
  const aiStatus = llmService.getStatus();
  const isDbConnected = mongoStatus === 'connected';

  const healthData = {
    service: 'Career Pilot AI API',
    status: isDbConnected ? 'healthy' : 'degraded',
    environment: env.NODE_ENV,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: {
      provider: 'MongoDB',
      status: mongoStatus,
      connected: isDbConnected,
    },
    aiService: {
      provider: aiStatus.activeProvider,
      configured: aiStatus.isConfigured,
      simulated: aiStatus.isSimulated,
    },
    system: {
      nodeVersion: process.version,
      memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    },
  };

  sendSuccess(res, healthData, 'Health check passed', 200);
};
