import { env } from '../config/env';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const logLevels: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevelWeight = logLevels[env.LOG_LEVEL as LogLevel] ?? 1;

export const logger = {
  debug: (message: string, ...meta: unknown[]) => {
    if (currentLevelWeight <= logLevels.debug) {
      console.debug(`[DEBUG] [${new Date().toISOString()}] ${message}`, ...meta);
    }
  },
  info: (message: string, ...meta: unknown[]) => {
    if (currentLevelWeight <= logLevels.info) {
      console.info(`[INFO]  [${new Date().toISOString()}] ${message}`, ...meta);
    }
  },
  warn: (message: string, ...meta: unknown[]) => {
    if (currentLevelWeight <= logLevels.warn) {
      console.warn(`[WARN]  [${new Date().toISOString()}] ${message}`, ...meta);
    }
  },
  error: (message: string, ...meta: unknown[]) => {
    if (currentLevelWeight <= logLevels.error) {
      console.error(`[ERROR] [${new Date().toISOString()}] ${message}`, ...meta);
    }
  },
};
