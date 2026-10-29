import { Request, Response, NextFunction } from 'express';
import { adminService, AdminActor } from '../services/admin.service';
import { auditLogService } from '../services/auditLog.service';
import { llmService } from '../services/ai';
import { sendSuccess, sendCreated } from '../utils/apiResponse';
import { JobOpportunity } from '../models/jobOpportunity.model';
import { AppError } from '../utils/appError';

const getActorFromRequest = (req: Request): AdminActor => {
  return {
    id: req.user!.userId,
    email: req.user!.email,
    name: req.user!.email.split('@')[0],
  };
};

export class AdminController {
  // 1. Overview
  public async getOverview(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const metrics = await adminService.getOverviewMetrics();
      sendSuccess(res, metrics, 'Admin overview metrics retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  // 2. Students
  public async getStudents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await adminService.getStudents(req.query);
      sendSuccess(res, data, 'Students retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  public async getStudentDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await adminService.getStudentDetail(req.params.id);
      sendSuccess(res, data, 'Student profile details retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  public async updateStudentStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = getActorFromRequest(req);
      const { status, reason } = req.body;
      const user = await adminService.updateAccountStatus(req.params.id, status, actor, reason);
      sendSuccess(res, { id: user._id.toString(), status: user.status }, 'User status updated successfully');
    } catch (err) {
      next(err);
    }
  }

  public async provisionAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = getActorFromRequest(req);
      const newAdmin = await adminService.provisionAdmin(req.body, actor);
      sendCreated(res, newAdmin, 'Administrator provisioned successfully');
    } catch (err) {
      next(err);
    }
  }

  // 3. Jobs
  public async getJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await adminService.getAdminJobs(req.query);
      sendSuccess(res, data, 'Jobs retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  public async createJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = getActorFromRequest(req);
      const job = await adminService.createJob(req.body, actor);
      sendCreated(res, job, 'Job created successfully');
    } catch (err) {
      next(err);
    }
  }

  public async getJobDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const job = await JobOpportunity.findById(req.params.id);
      if (!job) throw AppError.notFound('Job listing not found');
      sendSuccess(res, job, 'Job retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  public async updateJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = getActorFromRequest(req);
      const job = await adminService.updateJob(req.params.id, req.body, actor);
      sendSuccess(res, job, 'Job updated successfully');
    } catch (err) {
      next(err);
    }
  }

  public async updateJobStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = getActorFromRequest(req);
      const job = await adminService.updateJobStatus(req.params.id, req.body.status, actor);
      sendSuccess(res, job, 'Job status updated successfully');
    } catch (err) {
      next(err);
    }
  }

  public async deleteJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = getActorFromRequest(req);
      await adminService.deleteJob(req.params.id, actor);
      sendSuccess(res, null, 'Job listing deleted successfully');
    } catch (err) {
      next(err);
    }
  }

  // 4. Career Roles
  public async getCareerRoles(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roles = await adminService.getCareerRoles();
      sendSuccess(res, roles, 'Career roles catalog retrieved');
    } catch (err) {
      next(err);
    }
  }

  public async createCareerRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = getActorFromRequest(req);
      const role = await adminService.createCareerRole(req.body, actor);
      sendCreated(res, role, 'Career role created successfully');
    } catch (err) {
      next(err);
    }
  }

  public async updateCareerRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = getActorFromRequest(req);
      const role = await adminService.updateCareerRole(req.params.idOrSlug, req.body, actor);
      sendSuccess(res, role, 'Career role updated successfully');
    } catch (err) {
      next(err);
    }
  }

  public async toggleCareerRoleStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = getActorFromRequest(req);
      const role = await adminService.toggleCareerRoleStatus(req.params.idOrSlug, actor);
      sendSuccess(res, role, 'Career role status toggled');
    } catch (err) {
      next(err);
    }
  }

  // 5. Learning Resources
  public async getLearningResources(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await adminService.getLearningResources(req.query);
      sendSuccess(res, data, 'Learning resources retrieved');
    } catch (err) {
      next(err);
    }
  }

  public async createLearningResource(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = getActorFromRequest(req);
      const resource = await adminService.createLearningResource(req.body, actor);
      sendCreated(res, resource, 'Learning resource created successfully');
    } catch (err) {
      next(err);
    }
  }

  public async updateLearningResource(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = getActorFromRequest(req);
      const resource = await adminService.updateLearningResource(req.params.id, req.body, actor);
      sendSuccess(res, resource, 'Learning resource updated successfully');
    } catch (err) {
      next(err);
    }
  }

  public async deleteLearningResource(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = getActorFromRequest(req);
      await adminService.deleteLearningResource(req.params.id, actor);
      sendSuccess(res, null, 'Learning resource deleted successfully');
    } catch (err) {
      next(err);
    }
  }

  // 6. AI Monitoring
  public async getAiMonitoring(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = llmService.getMonitoringStats();
      sendSuccess(res, stats, 'AI service monitoring metrics retrieved');
    } catch (err) {
      next(err);
    }
  }

  // 7. Audit Logs
  public async getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await auditLogService.getAuditLogs(req.query);
      sendSuccess(res, data, 'Audit logs retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  // 8. Settings
  public async getSettings(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await adminService.getSettings();
      sendSuccess(res, settings, 'Platform settings retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  public async updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = getActorFromRequest(req);
      const settings = await adminService.updateSettings(req.body, actor);
      sendSuccess(res, settings, 'Platform settings updated successfully');
    } catch (err) {
      next(err);
    }
  }
}

export const adminController = new AdminController();

