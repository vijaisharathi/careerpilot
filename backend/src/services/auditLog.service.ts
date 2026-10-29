import { Types, FilterQuery } from 'mongoose';
import { Request } from 'express';
import { AuditLog, IAuditLog, AuditEventType } from '../models/auditLog.model';
import { logger } from '../utils/logger';

export interface LogAuditOptions {
  eventType: AuditEventType;
  actor: {
    id: string | Types.ObjectId;
    email: string;
    name: string;
    role?: string;
  };
  action: string;
  targetId?: string;
  targetType?: string;
  status?: 'success' | 'failure';
  metadata?: Record<string, unknown>;
  req?: Request;
}

export interface AuditQueryOptions {
  page?: number;
  limit?: number;
  eventType?: string;
  status?: string;
  actorEmail?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface PaginatedAuditResult {
  logs: IAuditLog[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export class AuditLogService {
  /**
   * Sanitizes metadata to strictly avoid persisting passwords, tokens, or secret keys
   */
  private sanitizeMetadata(data?: Record<string, unknown>): Record<string, unknown> {
    if (!data) return {};
    const sanitized: Record<string, unknown> = {};
    const sensitiveKeys = ['password', 'token', 'refreshtoken', 'secret', 'apikey', 'jwt'];

    for (const [key, value] of Object.entries(data)) {
      if (sensitiveKeys.some((k) => key.toLowerCase().includes(k))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        sanitized[key] = this.sanitizeMetadata(value as Record<string, unknown>);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  /**
   * Records a security-sensitive event in the administrative audit log
   */
  public async logEvent(options: LogAuditOptions): Promise<IAuditLog | null> {
    try {
      const {
        eventType,
        actor,
        action,
        targetId,
        targetType,
        status = 'success',
        metadata,
        req,
      } = options;

      const actorObjectId =
        typeof actor.id === 'string' ? new Types.ObjectId(actor.id) : actor.id;

      const ipAddress =
        req?.ip ||
        (req?.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
        req?.socket?.remoteAddress ||
        '127.0.0.1';

      const userAgent = (req?.headers['user-agent'] as string) || 'System Internal';

      const log = new AuditLog({
        eventType,
        actorId: actorObjectId,
        actorEmail: actor.email,
        actorName: actor.name,
        targetId: targetId ? targetId.toString() : undefined,
        targetType,
        action,
        status,
        metadata: this.sanitizeMetadata(metadata),
        ipAddress,
        userAgent,
      });

      await log.save();
      logger.info(`[AuditLog] ${eventType.toUpperCase()} by ${actor.email} (${action}) -> ${status}`);
      return log;
    } catch (err) {
      logger.error('[AuditLog] Failed to persist audit event:', (err as Error).message);
      return null;
    }
  }

  /**
   * Retrieves paginated audit logs with search and filtering
   */
  public async getAuditLogs(options: AuditQueryOptions): Promise<PaginatedAuditResult> {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: FilterQuery<IAuditLog> = {};

    if (options.eventType && options.eventType !== 'all') {
      filter.eventType = options.eventType;
    }

    if (options.status && options.status !== 'all') {
      filter.status = options.status;
    }

    if (options.actorEmail) {
      filter.actorEmail = new RegExp(options.actorEmail.trim(), 'i');
    }

    if (options.search) {
      const regex = new RegExp(options.search.trim(), 'i');
      filter.$or = [
        { action: regex },
        { actorEmail: regex },
        { actorName: regex },
        { targetType: regex },
      ];
    }

    if (options.startDate || options.endDate) {
      filter.createdAt = {};
      if (options.startDate) {
        filter.createdAt.$gte = new Date(options.startDate);
      }
      if (options.endDate) {
        filter.createdAt.$lte = new Date(options.endDate);
      }
    }

    const [logs, totalCount] = await Promise.all([
      AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      AuditLog.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalCount / limit) || 1;

    return {
      logs: logs as unknown as IAuditLog[],
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Retrieves recent audit entries for dashboard summaries
   */
  public async getRecentLogs(limit: number = 5): Promise<IAuditLog[]> {
    return AuditLog.find().sort({ createdAt: -1 }).limit(limit).lean() as unknown as Promise<IAuditLog[]>;
  }
}

export const auditLogService = new AuditLogService();

