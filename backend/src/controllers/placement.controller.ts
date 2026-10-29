import { Request, Response, NextFunction } from 'express';
import { placementOfficerService } from '../services/placementOfficer.service';
import { placementStudentService } from '../services/placementStudent.service';
import { adminService } from '../services/admin.service';
import { sendSuccess, sendCreated } from '../utils/apiResponse';
import { AppError } from '../utils/appError';

export class PlacementController {
  // Helper to extract officer actor
  private getOfficerActor(req: Request) {
    if (!req.user) {
      throw AppError.unauthorized('Authentication required');
    }
    return {
      id: req.user.userId,
      email: req.user.email,
      name: (req.user as any).name || req.user.email.split('@')[0],
      role: req.user.role,
      institutionId: req.user.institutionId,
    };
  }

  // ==========================================
  // PLACEMENT OFFICER HANDLERS
  // ==========================================

  public getDashboardMetrics = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const actor = this.getOfficerActor(req);
      const data = await placementOfficerService.getDashboardMetrics(actor);
      sendSuccess(res, data, 'Dashboard placement metrics retrieved');
    } catch (error) {
      next(error);
    }
  };

  public getStudentDirectory = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const actor = this.getOfficerActor(req);
      const query = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 10,
        search: req.query.search as string,
        department: req.query.department as string,
        graduationYear: req.query.graduationYear
          ? parseInt(req.query.graduationYear as string, 10)
          : undefined,
        readinessCategory: req.query.readinessCategory as string,
        placementStatus: req.query.placementStatus as string,
      };

      const data = await placementOfficerService.getStudentDirectory(actor, query);
      sendSuccess(res, data, 'Student placement directory retrieved');
    } catch (error) {
      next(error);
    }
  };

  public getStudentPlacementDetail = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const actor = this.getOfficerActor(req);
      const data = await placementOfficerService.getStudentPlacementDetail(
        actor,
        req.params.id
      );
      sendSuccess(res, data, 'Student placement summary retrieved');
    } catch (error) {
      next(error);
    }
  };

  public getRecruitmentDrives = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const actor = this.getOfficerActor(req);
      const query = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 10,
        status: req.query.status as string,
        search: req.query.search as string,
      };

      const data = await placementOfficerService.getRecruitmentDrives(actor, query);
      sendSuccess(res, data, 'Recruitment drives retrieved');
    } catch (error) {
      next(error);
    }
  };

  public getRecruitmentDriveDetail = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const actor = this.getOfficerActor(req);
      const data = await placementOfficerService.getRecruitmentDriveDetail(
        actor,
        req.params.id
      );
      sendSuccess(res, data, 'Recruitment drive details retrieved');
    } catch (error) {
      next(error);
    }
  };

  public createRecruitmentDrive = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const actor = this.getOfficerActor(req);
      const drive = await placementOfficerService.createRecruitmentDrive(actor, req.body);
      sendCreated(res, drive, 'Recruitment drive created successfully');
    } catch (error) {
      next(error);
    }
  };

  public updateRecruitmentDrive = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const actor = this.getOfficerActor(req);
      const drive = await placementOfficerService.updateRecruitmentDrive(
        actor,
        req.params.id,
        req.body
      );
      sendSuccess(res, drive, 'Recruitment drive updated successfully');
    } catch (error) {
      next(error);
    }
  };

  public changeDriveStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const actor = this.getOfficerActor(req);
      const drive = await placementOfficerService.changeDriveStatus(
        actor,
        req.params.id,
        req.body.status
      );
      sendSuccess(res, drive, 'Drive status updated successfully');
    } catch (error) {
      next(error);
    }
  };

  public getDriveCandidates = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const actor = this.getOfficerActor(req);
      const query = {
        stage: req.query.stage as string,
        eligibility: req.query.eligibility as string,
      };
      const candidates = await placementOfficerService.getDriveCandidates(
        actor,
        req.params.id,
        query
      );
      sendSuccess(res, candidates, 'Drive candidates retrieved');
    } catch (error) {
      next(error);
    }
  };

  public updateCandidateStage = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const actor = this.getOfficerActor(req);
      const registration = await placementOfficerService.updateCandidateStage(
        actor,
        req.params.id,
        req.params.registrationId,
        req.body.stage,
        req.body.comment,
        req.body.offerDetails
      );
      sendSuccess(res, registration, 'Candidate stage updated successfully');
    } catch (error) {
      next(error);
    }
  };

  public overrideCandidateEligibility = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const actor = this.getOfficerActor(req);
      const registration = await placementOfficerService.overrideCandidateEligibility(
        actor,
        req.params.id,
        req.params.registrationId,
        req.body.status,
        req.body.reason
      );
      sendSuccess(res, registration, 'Candidate eligibility override recorded');
    } catch (error) {
      next(error);
    }
  };

  public getPlacementAnalytics = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const actor = this.getOfficerActor(req);
      const analytics = await placementOfficerService.getPlacementAnalytics(actor);
      sendSuccess(res, analytics, 'Placement analytics retrieved');
    } catch (error) {
      next(error);
    }
  };

  public exportPlacementDataCsv = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const actor = this.getOfficerActor(req);
      const exportType = (req.query.type as 'students' | 'drives' | 'candidates') || 'students';
      const driveId = req.query.driveId as string;

      const csvData = await placementOfficerService.exportPlacementDataCsv(
        actor,
        exportType,
        driveId
      );

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="placement_${exportType}_${Date.now()}.csv"`
      );
      res.status(200).send(csvData);
    } catch (error) {
      next(error);
    }
  };

  public getAnnouncements = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const actor = this.getOfficerActor(req);
      const data = await placementOfficerService.getAnnouncements(actor);
      sendSuccess(res, data, 'Announcements retrieved');
    } catch (error) {
      next(error);
    }
  };

  public createAnnouncement = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const actor = this.getOfficerActor(req);
      const announcement = await placementOfficerService.createAnnouncement(actor, req.body);
      sendCreated(res, announcement, 'Announcement created successfully');
    } catch (error) {
      next(error);
    }
  };

  public provisionPlacementOfficer = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        throw AppError.forbidden('Only administrators can provision Placement Officer accounts.');
      }
      const actor = {
        id: req.user.userId,
        email: req.user.email,
        name: (req.user as any).name || 'Administrator',
      };
      const result = await adminService.provisionPlacementOfficer(req.body, actor);
      sendCreated(res, result, 'Placement Officer account provisioned successfully');
    } catch (error) {
      next(error);
    }
  };

  // ==========================================
  // STUDENT CAMPUS PLACEMENT HANDLERS
  // ==========================================

  public getStudentCampusDrives = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) throw AppError.unauthorized();
      const actor = {
        id: req.user.userId,
        email: req.user.email,
        name: (req.user as any).name || 'Student',
        role: req.user.role,
        institutionId: req.user.institutionId,
      };

      const data = await placementStudentService.getCampusDrives(actor);
      sendSuccess(res, data, 'Available campus drives retrieved');
    } catch (error) {
      next(error);
    }
  };

  public registerForCampusDrive = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) throw AppError.unauthorized();
      const actor = {
        id: req.user.userId,
        email: req.user.email,
        name: (req.user as any).name || 'Student',
        role: req.user.role,
        institutionId: req.user.institutionId,
      };

      const result = await placementStudentService.registerForCampusDrive(
        actor,
        req.params.id
      );
      sendCreated(res, result, 'Registration successful');
    } catch (error) {
      next(error);
    }
  };

  public getStudentRegistrations = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) throw AppError.unauthorized();
      const actor = {
        id: req.user.userId,
        email: req.user.email,
        name: (req.user as any).name || 'Student',
        role: req.user.role,
      };

      const data = await placementStudentService.getStudentRegistrations(actor);
      sendSuccess(res, data, 'Student drive registrations retrieved');
    } catch (error) {
      next(error);
    }
  };

  public getStudentAnnouncements = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) throw AppError.unauthorized();
      const actor = {
        id: req.user.userId,
        email: req.user.email,
        name: (req.user as any).name || 'Student',
        role: req.user.role,
        institutionId: req.user.institutionId,
      };

      const data = await placementStudentService.getCampusAnnouncements(actor);
      sendSuccess(res, data, 'Campus announcements retrieved');
    } catch (error) {
      next(error);
    }
  };
}

export const placementController = new PlacementController();
