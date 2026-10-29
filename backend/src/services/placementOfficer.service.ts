import { Types, FilterQuery } from 'mongoose';
import { AppError } from '../utils/appError';
import {
  User,
  StudentProfile,
  IStudentProfile,
  Institution,
  IInstitution,
  PlacementDrive,
  IPlacementDrive,
  PlacementRegistration,
  IPlacementRegistration,
  PlacementAnnouncement,
  IPlacementAnnouncement,
  CareerAnalysis,
  JobApplication,
} from '../models';
import { placementReadinessService, ReadinessCategory } from './placementReadiness.service';
import { auditLogService } from './auditLog.service';

export interface OfficerActor {
  id: string;
  email: string;
  name: string;
  role: string;
  institutionId?: string;
}

export interface StudentDirectoryQuery {
  page?: number;
  limit?: number;
  search?: string;
  department?: string;
  graduationYear?: number;
  readinessCategory?: string;
  placementStatus?: string;
}

export interface DriveFilterQuery {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export class PlacementOfficerService {
  /**
   * Resolves and verifies the authorized institution for an actor.
   */
  public async resolveOfficerInstitution(actor: OfficerActor): Promise<IInstitution> {
    let institutionId: Types.ObjectId | null = null;

    if (actor.institutionId && Types.ObjectId.isValid(actor.institutionId)) {
      institutionId = new Types.ObjectId(actor.institutionId);
    } else {
      // Find from user record
      const user = await User.findById(actor.id);
      if (user?.institutionId) {
        institutionId = user.institutionId;
      }
    }

    if (institutionId) {
      const institution = await Institution.findById(institutionId);
      if (institution) {
        return institution;
      }
    }

    // If actor is admin, allow querying default or first active institution
    if (actor.role === 'admin') {
      let inst = await Institution.findOne({ isActive: true });
      if (!inst) {
        inst = await Institution.create({
          name: 'Apex Institute of Technology',
          code: 'AIT',
          domain: 'apex.edu',
          departments: [
            'Computer Science and Engineering',
            'Information Technology',
            'Electronics and Communication Engineering',
            'Electrical and Electronics Engineering',
            'Mechanical Engineering',
            'Data Science and Artificial Intelligence',
          ],
          isActive: true,
        });
      }
      return inst;
    }

    throw AppError.forbidden(
      'No authorized institution is assigned to this Placement Officer account. Please contact system administrator.'
    );
  }

  /**
   * Helper to build a MongoDB filter for students within the officer's institution scope.
   */
  private async getStudentScopeFilter(institution: IInstitution): Promise<FilterQuery<IStudentProfile>> {
    return {
      $or: [
        { institutionId: institution._id },
        { college: { $regex: new RegExp(`^${institution.name}$|^${institution.code}$`, 'i') } },
      ],
    };
  }

  /**
   * 1. Placement Dashboard Metrics
   */
  public async getDashboardMetrics(actor: OfficerActor) {
    const institution = await this.resolveOfficerInstitution(actor);
    const scopeFilter = await this.getStudentScopeFilter(institution);

    // 1. Students in scope
    const studentsInScope = await StudentProfile.find(scopeFilter)
      .select('_id user fullName department graduationYear completionPercentage placementStatus')
      .lean();

    const studentUserIds = studentsInScope.map((s) => s.user);
    const totalStudents = studentsInScope.length;

    // 2. Profile completion & assessment counts
    const completedProfiles = studentsInScope.filter(
      (s) => (s.completionPercentage || 0) >= 70
    ).length;

    const [assessmentsCount, activeDrives, totalRegistrations, driveApplications, placedStudents] =
      await Promise.all([
        CareerAnalysis.countDocuments({ user: { $in: studentUserIds } }),
        PlacementDrive.find({
          institutionId: institution._id,
          status: { $in: ['published', 'registration_open', 'in_progress'] },
        })
          .sort({ registrationDeadline: 1 })
          .lean(),
        PlacementRegistration.find({ institutionId: institution._id })
          .select('currentStage eligibilityStatus driveId studentId')
          .lean(),
        JobApplication.countDocuments({
          user: { $in: studentUserIds },
          source: { $regex: /placement|campus/i },
        }),
        PlacementRegistration.distinct('studentId', {
          institutionId: institution._id,
          currentStage: { $in: ['offered', 'accepted'] },
        }),
      ]);

    // Calculate readiness distribution on student subset
    let studentsReady = 0;
    let studentsNearlyReady = 0;
    for (const student of studentsInScope.slice(0, 50)) {
      if ((student.completionPercentage || 0) >= 70) {
        studentsReady++;
      } else if ((student.completionPercentage || 0) >= 50) {
        studentsNearlyReady++;
      }
    }

    // Pending placement tasks
    const pendingEligibilityReviews = totalRegistrations.filter(
      (r) => r.eligibilityStatus === 'needs_review'
    ).length;
    const candidatesInInterview = totalRegistrations.filter(
      (r) => r.currentStage === 'interview'
    ).length;

    // Upcoming events / deadlines
    const upcomingDeadlines = activeDrives.map((d) => ({
      id: d._id.toString(),
      companyName: d.companyName,
      driveTitle: d.driveTitle,
      registrationDeadline: d.registrationDeadline,
      assessmentDate: d.assessmentDate,
      status: d.status,
    }));

    return {
      institution: {
        id: institution._id.toString(),
        name: institution.name,
        code: institution.code,
      },
      metrics: {
        totalStudents,
        completedProfiles,
        completedAssessments: assessmentsCount,
        placementReadyStudents: studentsReady,
        nearlyReadyStudents: studentsNearlyReady,
        activeDrivesCount: activeDrives.length,
        totalCandidatesRegistered: totalRegistrations.length,
        placementApplicationsCount: driveApplications || totalRegistrations.length,
        studentsWithOffersCount: placedStudents.length,
        pendingEligibilityReviews,
        candidatesInInterview,
      },
      upcomingDeadlines,
    };
  }

  /**
   * 2. Student Directory (Scoped to Officer's Institution)
   */
  public async getStudentDirectory(actor: OfficerActor, query: StudentDirectoryQuery) {
    const institution = await this.resolveOfficerInstitution(actor);
    const scopeFilter = await this.getStudentScopeFilter(institution);

    const page = Math.max(1, query.page || 1);
    const limit = Math.min(50, Math.max(1, query.limit || 10));
    const skip = (page - 1) * limit;

    const filter: FilterQuery<IStudentProfile> = { ...scopeFilter };

    if (query.search && query.search.trim()) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [{ fullName: searchRegex }, { email: searchRegex }, { headline: searchRegex }],
      });
    }

    if (query.department && query.department !== 'all') {
      filter.department = { $regex: new RegExp(query.department, 'i') };
    }

    if (query.graduationYear) {
      filter.graduationYear = Number(query.graduationYear);
    }

    if (query.placementStatus && query.placementStatus !== 'all') {
      filter.placementStatus = query.placementStatus as 'unplaced' | 'in_process' | 'placed';
    }

    const [profiles, totalCount] = await Promise.all([
      StudentProfile.find(filter)
        .sort({ graduationYear: -1, fullName: 1 })
        .skip(skip)
        .limit(limit)
        .select(
          'user fullName email department degree graduationYear completionPercentage placementStatus skills'
        )
        .lean(),
      StudentProfile.countDocuments(filter),
    ]);

    // Augment with drive registrations count and readiness category
    const userIds = profiles.map((p) => p.user);
    const registrations = await PlacementRegistration.find({
      studentId: { $in: userIds },
      institutionId: institution._id,
    })
      .select('studentId currentStage')
      .lean();

    const registrationMap = new Map<string, { total: number; hasOffer: boolean }>();
    for (const reg of registrations) {
      const sId = reg.studentId.toString();
      const existing = registrationMap.get(sId) || { total: 0, hasOffer: false };
      existing.total += 1;
      if (['offered', 'accepted'].includes(reg.currentStage)) {
        existing.hasOffer = true;
      }
      registrationMap.set(sId, existing);
    }

    const students = profiles.map((p) => {
      const sId = p.user.toString();
      const regData = registrationMap.get(sId) || { total: 0, hasOffer: false };
      const completion = p.completionPercentage || 0;

      let estimatedCategory: ReadinessCategory = 'Needs Preparation';
      if (completion >= 75 && (p.skills || []).length >= 5) {
        estimatedCategory = 'Ready';
      } else if (completion >= 50) {
        estimatedCategory = 'Nearly Ready';
      } else if (completion < 30) {
        estimatedCategory = 'Insufficient Data';
      }

      return {
        id: sId,
        profileId: p._id.toString(),
        fullName: p.fullName,
        email: p.email,
        department: p.department || 'General',
        degree: p.degree || 'B.Tech',
        graduationYear: p.graduationYear || new Date().getFullYear(),
        completionPercentage: completion,
        placementStatus: regData.hasOffer ? 'placed' : p.placementStatus || 'unplaced',
        skillsCount: (p.skills || []).length,
        topSkills: (p.skills || []).slice(0, 4).map((s) => s.name),
        readinessCategory: estimatedCategory,
        drivesAppliedCount: regData.total,
        hasOffer: regData.hasOffer,
      };
    });

    return {
      students,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
        hasNextPage: page * limit < totalCount,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * 3. Student Placement Detail / Safe Dossier
   */
  public async getStudentPlacementDetail(actor: OfficerActor, studentUserId: string) {
    if (!Types.ObjectId.isValid(studentUserId)) {
      throw AppError.badRequest('Invalid student ID format');
    }

    const institution = await this.resolveOfficerInstitution(actor);
    const userObjectId = new Types.ObjectId(studentUserId);

    const [user, profile] = await Promise.all([
      User.findById(userObjectId).select('name email role status createdAt lastLoginAt institutionId'),
      StudentProfile.findOne({ user: userObjectId }),
    ]);

    if (!user || !profile) {
      throw AppError.notFound('Student record not found');
    }

    // Verify student belongs to officer's authorized institution
    const isSameInstId =
      user.institutionId && user.institutionId.toString() === institution._id.toString();
    const isSameProfileInst =
      profile.institutionId && profile.institutionId.toString() === institution._id.toString();
    const isSameCollegeName =
      profile.college &&
      (profile.college.toLowerCase() === institution.name.toLowerCase() ||
        profile.college.toLowerCase() === institution.code.toLowerCase());

    if (actor.role !== 'admin' && !isSameInstId && !isSameProfileInst && !isSameCollegeName) {
      throw AppError.forbidden(
        'Access denied. This student does not belong to your authorized institution.'
      );
    }

    // Evaluate transparent placement readiness
    const readiness = await placementReadinessService.evaluateReadiness(userObjectId, profile);

    // Retrieve campus drive history
    const driveRegistrations = await PlacementRegistration.find({
      studentId: userObjectId,
      institutionId: institution._id,
    })
      .populate('driveId', 'companyName driveTitle jobRole status registrationDeadline compensation')
      .sort({ appliedDate: -1 })
      .lean();

    return {
      student: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        department: profile.department,
        degree: profile.degree,
        graduationYear: profile.graduationYear,
        headline: profile.headline,
        completionPercentage: profile.completionPercentage || 0,
        placementStatus: profile.placementStatus || 'unplaced',
        skills: (profile.skills || []).map((s) => ({
          name: s.name,
          category: s.category,
          proficiency: s.proficiency,
        })),
        projectsCount: (profile.projects || []).length,
        certificationsCount: (profile.certifications || []).length,
        targetRoles: profile.careerInterests?.targetRoles || [],
      },
      readiness,
      registrations: driveRegistrations.map((r) => ({
        id: r._id.toString(),
        driveId: (r.driveId as any)?._id?.toString() || r.driveId?.toString(),
        companyName: (r.driveId as any)?.companyName || 'Company',
        driveTitle: (r.driveId as any)?.driveTitle || 'Drive',
        jobRole: (r.driveId as any)?.jobRole || '',
        currentStage: r.currentStage,
        eligibilityStatus: r.eligibilityStatus,
        appliedDate: r.appliedDate,
        offerDetails: r.offerDetails,
        stageHistory: r.stageHistory,
      })),
    };
  }

  /**
   * 4. Recruitment Drive Management (CRUD)
   */
  public async getRecruitmentDrives(
    actor: OfficerActor,
    query: DriveFilterQuery
  ): Promise<{ drives: any[]; pagination: any }> {
    const institution = await this.resolveOfficerInstitution(actor);

    const page = Math.max(1, query.page || 1);
    const limit = Math.min(50, Math.max(1, query.limit || 10));
    const skip = (page - 1) * limit;

    const filter: FilterQuery<IPlacementDrive> = { institutionId: institution._id };

    if (query.status && query.status !== 'all') {
      filter.status = query.status as any;
    }

    if (query.search && query.search.trim()) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { companyName: searchRegex },
        { driveTitle: searchRegex },
        { jobRole: searchRegex },
      ];
    }

    const [drives, totalCount] = await Promise.all([
      PlacementDrive.find(filter)
        .sort({ registrationDeadline: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PlacementDrive.countDocuments(filter),
    ]);

    // Attach candidate counts
    const driveIds = drives.map((d) => d._id);
    const candidateCounts = await PlacementRegistration.aggregate([
      { $match: { driveId: { $in: driveIds } } },
      {
        $group: {
          _id: '$driveId',
          total: { $sum: 1 },
          shortlisted: {
            $sum: { $cond: [{ $in: ['$currentStage', ['shortlisted', 'assessment', 'interview', 'offered', 'accepted']] }, 1, 0] },
          },
          offered: {
            $sum: { $cond: [{ $in: ['$currentStage', ['offered', 'accepted']] }, 1, 0] },
          },
        },
      },
    ]);

    const countMap = new Map<string, { total: number; shortlisted: number; offered: number }>();
    for (const c of candidateCounts) {
      countMap.set(c._id.toString(), {
        total: c.total,
        shortlisted: c.shortlisted,
        offered: c.offered,
      });
    }

    const formatted = drives.map((d) => {
      const counts = countMap.get(d._id.toString()) || { total: 0, shortlisted: 0, offered: 0 };
      return {
        ...d,
        id: d._id.toString(),
        candidateCounts: counts,
      };
    });

    return {
      drives: formatted,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
        hasNextPage: page * limit < totalCount,
        hasPrevPage: page > 1,
      },
    };
  }

  public async getRecruitmentDriveDetail(
    actor: OfficerActor,
    driveId: string
  ): Promise<any> {
    if (!Types.ObjectId.isValid(driveId)) {
      throw AppError.badRequest('Invalid drive ID format');
    }

    const institution = await this.resolveOfficerInstitution(actor);
    const drive = await PlacementDrive.findOne({
      _id: new Types.ObjectId(driveId),
      institutionId: institution._id,
    }).lean();

    if (!drive) {
      throw AppError.notFound('Recruitment drive not found');
    }

    // Get stage breakdown counts
    const stageCounts = await PlacementRegistration.aggregate([
      { $match: { driveId: drive._id } },
      { $group: { _id: '$currentStage', count: { $sum: 1 } } },
    ]);

    const breakdown: Record<string, number> = {
      registered: 0,
      shortlisted: 0,
      assessment: 0,
      interview: 0,
      selected: 0,
      offered: 0,
      accepted: 0,
      rejected: 0,
      withdrawn: 0,
    };
    for (const s of stageCounts) {
      breakdown[s._id] = s.count;
    }

    return {
      ...drive,
      id: drive._id.toString(),
      stageBreakdown: breakdown,
      totalRegistered: Object.values(breakdown).reduce((a, b) => a + b, 0),
    };
  }

  public async createRecruitmentDrive(actor: OfficerActor, payload: Partial<IPlacementDrive>) {
    const institution = await this.resolveOfficerInstitution(actor);

    // Validate dates
    const startDate = new Date(payload.registrationStartDate || Date.now());
    const deadline = new Date(payload.registrationDeadline || Date.now());

    if (deadline < startDate) {
      throw AppError.badRequest('Registration deadline cannot precede the registration start date.');
    }

    // Validate application URL if provided
    if (payload.applicationUrl && !payload.applicationUrl.match(/^https?:\/\//i)) {
      throw AppError.badRequest('Application URL must begin with http:// or https://');
    }

    const drive = new PlacementDrive({
      institutionId: institution._id,
      companyName: (payload.companyName || '').trim(),
      driveTitle: (payload.driveTitle || '').trim(),
      jobRole: (payload.jobRole || '').trim(),
      jobDescription: (payload.jobDescription || '').trim(),
      requiredSkills: payload.requiredSkills || [],
      eligibilityCriteria: payload.eligibilityCriteria || {
        eligibleDepartments: [],
        eligibleGraduationYears: [],
      },
      openingsCount: payload.openingsCount,
      location: (payload.location || 'Campus / Remote').trim(),
      employmentType: payload.employmentType || 'Full-time',
      workMode: payload.workMode || 'On-site',
      compensation: payload.compensation || { amount: '', period: 'yearly', currency: 'USD' },
      registrationStartDate: startDate,
      registrationDeadline: deadline,
      assessmentDate: payload.assessmentDate ? new Date(payload.assessmentDate) : undefined,
      interviewDates: (payload.interviewDates || []).map((d) => new Date(d)),
      applicationUrl: payload.applicationUrl?.trim(),
      status: payload.status || 'draft',
      assignedOfficerId: new Types.ObjectId(actor.id),
      createdBy: new Types.ObjectId(actor.id),
    });

    await drive.save();

    await auditLogService.logEvent({
      eventType: 'drive_created',
      actor,
      action: `Created recruitment drive "${drive.driveTitle}" for ${drive.companyName}`,
      targetId: drive._id.toString(),
      targetType: 'PlacementDrive',
      metadata: { institutionId: institution._id.toString(), companyName: drive.companyName },
    });

    return drive;
  }

  public async updateRecruitmentDrive(
    actor: OfficerActor,
    driveId: string,
    payload: Partial<IPlacementDrive>
  ) {
    if (!Types.ObjectId.isValid(driveId)) {
      throw AppError.badRequest('Invalid drive ID format');
    }

    const institution = await this.resolveOfficerInstitution(actor);
    const drive = await PlacementDrive.findOne({
      _id: new Types.ObjectId(driveId),
      institutionId: institution._id,
    });

    if (!drive) {
      throw AppError.notFound('Recruitment drive not found');
    }

    if (payload.registrationStartDate && payload.registrationDeadline) {
      if (new Date(payload.registrationDeadline) < new Date(payload.registrationStartDate)) {
        throw AppError.badRequest('Registration deadline cannot precede the registration start date.');
      }
    }

    if (payload.applicationUrl && !payload.applicationUrl.match(/^https?:\/\//i)) {
      throw AppError.badRequest('Application URL must begin with http:// or https://');
    }

    Object.assign(drive, payload);
    await drive.save();

    await auditLogService.logEvent({
      eventType: 'drive_updated',
      actor,
      action: `Updated recruitment drive "${drive.driveTitle}" for ${drive.companyName}`,
      targetId: drive._id.toString(),
      targetType: 'PlacementDrive',
      metadata: { institutionId: institution._id.toString(), status: drive.status },
    });

    return drive;
  }

  public async changeDriveStatus(actor: OfficerActor, driveId: string, status: string) {
    const validStatuses = [
      'draft',
      'published',
      'registration_open',
      'registration_closed',
      'in_progress',
      'completed',
      'cancelled',
    ];

    if (!validStatuses.includes(status)) {
      throw AppError.badRequest(`Invalid drive status. Allowed: ${validStatuses.join(', ')}`);
    }

    const institution = await this.resolveOfficerInstitution(actor);
    const drive = await PlacementDrive.findOne({
      _id: new Types.ObjectId(driveId),
      institutionId: institution._id,
    });

    if (!drive) {
      throw AppError.notFound('Recruitment drive not found');
    }

    const previousStatus = drive.status;
    drive.status = status as any;
    await drive.save();

    await auditLogService.logEvent({
      eventType: 'drive_status_change',
      actor,
      action: `Changed recruitment drive "${drive.driveTitle}" status from ${previousStatus} to ${status}`,
      targetId: drive._id.toString(),
      targetType: 'PlacementDrive',
      metadata: { previousStatus, newStatus: status },
    });

    return drive;
  }

  /**
   * 5. Candidate Registrations & Selection Tracking
   */
  public async getDriveCandidates(actor: OfficerActor, driveId: string, query?: { stage?: string; eligibility?: string }) {
    if (!Types.ObjectId.isValid(driveId)) {
      throw AppError.badRequest('Invalid drive ID format');
    }

    const institution = await this.resolveOfficerInstitution(actor);
    const driveObjectId = new Types.ObjectId(driveId);

    const filter: FilterQuery<IPlacementRegistration> = {
      driveId: driveObjectId,
      institutionId: institution._id,
    };

    if (query?.stage && query.stage !== 'all') {
      filter.currentStage = query.stage as any;
    }

    if (query?.eligibility && query.eligibility !== 'all') {
      filter.eligibilityStatus = query.eligibility as any;
    }

    const registrations = await PlacementRegistration.find(filter)
      .populate('studentId', 'name email')
      .sort({ appliedDate: -1 })
      .lean();

    // Augment with student profile details (department, degree, grad year)
    const studentUserIds = registrations.map((r) => (r.studentId as any)?._id || r.studentId);
    const profiles = await StudentProfile.find({ user: { $in: studentUserIds } })
      .select('user department degree graduationYear completionPercentage')
      .lean();

    const profileMap = new Map<string, any>();
    for (const p of profiles) {
      profileMap.set(p.user.toString(), p);
    }

    return registrations.map((r) => {
      const sId = (r.studentId as any)?._id?.toString() || r.studentId?.toString();
      const p = profileMap.get(sId);

      return {
        id: r._id.toString(),
        driveId: r.driveId.toString(),
        studentId: sId,
        studentName: (r.studentId as any)?.name || 'Candidate',
        studentEmail: (r.studentId as any)?.email || '',
        department: p?.department || 'Unspecified',
        degree: p?.degree || '',
        graduationYear: p?.graduationYear,
        completionPercentage: p?.completionPercentage || 0,
        eligibilityStatus: r.eligibilityStatus,
        eligibilityEvaluation: r.eligibilityEvaluation,
        currentStage: r.currentStage,
        stageHistory: r.stageHistory,
        offerDetails: r.offerDetails,
        appliedDate: r.appliedDate,
      };
    });
  }

  public async updateCandidateStage(
    actor: OfficerActor,
    driveId: string,
    registrationId: string,
    newStage: string,
    comment?: string,
    offerDetails?: { salary?: string; designation?: string; offerLetterUrl?: string }
  ) {
    const validStages = [
      'registered',
      'shortlisted',
      'assessment',
      'interview',
      'selected',
      'offered',
      'accepted',
      'rejected',
      'withdrawn',
    ];

    if (!validStages.includes(newStage)) {
      throw AppError.badRequest(`Invalid recruitment stage. Allowed: ${validStages.join(', ')}`);
    }

    const institution = await this.resolveOfficerInstitution(actor);
    const registration = await PlacementRegistration.findOne({
      _id: new Types.ObjectId(registrationId),
      driveId: new Types.ObjectId(driveId),
      institutionId: institution._id,
    });

    if (!registration) {
      throw AppError.notFound('Candidate registration record not found');
    }

    const previousStage = registration.currentStage;
    registration.currentStage = newStage as any;
    registration.stageHistory.push({
      stage: newStage as any,
      timestamp: new Date(),
      updatedBy: new Types.ObjectId(actor.id),
      comment: comment || `Stage progressed from ${previousStage} to ${newStage}`,
    });

    if (offerDetails && ['offered', 'accepted'].includes(newStage)) {
      registration.offerDetails = {
        ...offerDetails,
        recordedAt: new Date(),
      };
    }

    await registration.save();

    // If accepted offer, update student's profile placement status
    if (newStage === 'accepted') {
      await StudentProfile.findOneAndUpdate(
        { user: registration.studentId },
        { placementStatus: 'placed' }
      );
    }

    await auditLogService.logEvent({
      eventType: 'candidate_stage_update',
      actor,
      action: `Updated candidate ${registration.studentId} stage from ${previousStage} to ${newStage}`,
      targetId: registration._id.toString(),
      targetType: 'PlacementRegistration',
      metadata: { previousStage, newStage, driveId },
    });

    return registration;
  }

  public async overrideCandidateEligibility(
    actor: OfficerActor,
    driveId: string,
    registrationId: string,
    newStatus: string,
    reason: string
  ) {
    if (!reason || reason.trim().length < 5) {
      throw AppError.badRequest(
        'An explicit justification reason (at least 5 characters) is required to override candidate eligibility.'
      );
    }

    const allowed = ['eligible', 'not_eligible', 'needs_review'];
    if (!allowed.includes(newStatus)) {
      throw AppError.badRequest(`Invalid eligibility status. Allowed: ${allowed.join(', ')}`);
    }

    const institution = await this.resolveOfficerInstitution(actor);
    const registration = await PlacementRegistration.findOne({
      _id: new Types.ObjectId(registrationId),
      driveId: new Types.ObjectId(driveId),
      institutionId: institution._id,
    });

    if (!registration) {
      throw AppError.notFound('Candidate registration record not found');
    }

    const previousStatus = registration.eligibilityStatus;
    registration.eligibilityStatus = newStatus as any;
    registration.eligibilityEvaluation.isOverridden = true;
    registration.eligibilityEvaluation.overriddenBy = new Types.ObjectId(actor.id);
    registration.eligibilityEvaluation.overrideReason = reason.trim();
    registration.eligibilityEvaluation.overriddenAt = new Date();

    await registration.save();

    await auditLogService.logEvent({
      eventType: 'eligibility_override',
      actor,
      action: `Overrode candidate eligibility from ${previousStatus} to ${newStatus}. Reason: ${reason}`,
      targetId: registration._id.toString(),
      targetType: 'PlacementRegistration',
      metadata: { previousStatus, newStatus, reason, driveId },
    });

    return registration;
  }

  /**
   * 6. Placement Analytics & Group Reports
   */
  public async getPlacementAnalytics(actor: OfficerActor) {
    const institution = await this.resolveOfficerInstitution(actor);
    const scopeFilter = await this.getStudentScopeFilter(institution);

    // Retrieve all students in scope
    const students = await StudentProfile.find(scopeFilter)
      .select('user department graduationYear completionPercentage placementStatus skills')
      .lean();

    const totalStudents = students.length;

    // Retrieve registrations
    const registrations = await PlacementRegistration.find({
      institutionId: institution._id,
    })
      .select('driveId studentId currentStage eligibilityStatus offerDetails appliedDate')
      .lean();

    // 1. Department-wise breakdown
    const deptMap = new Map<
      string,
      { total: number; placed: number; inProcess: number; unplaced: number }
    >();

    for (const s of students) {
      const dept = s.department || 'General';
      const stats = deptMap.get(dept) || { total: 0, placed: 0, inProcess: 0, unplaced: 0 };
      stats.total += 1;
      if (s.placementStatus === 'placed') {
        stats.placed += 1;
      } else if (s.placementStatus === 'in_process') {
        stats.inProcess += 1;
      } else {
        stats.unplaced += 1;
      }
      deptMap.set(dept, stats);
    }

    const departmentWise = Array.from(deptMap.entries()).map(([department, data]) => ({
      department,
      totalStudents: data.total,
      placedCount: data.placed,
      placementRatePercentage: data.total > 0 ? Math.round((data.placed / data.total) * 100) : 0,
      inProcessCount: data.inProcess,
      unplacedCount: data.unplaced,
    }));

    // 2. Graduation Year Summaries
    const yearMap = new Map<number, { total: number; placed: number }>();
    for (const s of students) {
      const yr = s.graduationYear || new Date().getFullYear();
      const stats = yearMap.get(yr) || { total: 0, placed: 0 };
      stats.total += 1;
      if (s.placementStatus === 'placed') stats.placed += 1;
      yearMap.set(yr, stats);
    }

    const graduationYearWise = Array.from(yearMap.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([year, data]) => ({
        graduationYear: year,
        totalStudents: data.total,
        placedCount: data.placed,
        placementRatePercentage: data.total > 0 ? Math.round((data.placed / data.total) * 100) : 0,
      }));

    // 3. Recruitment Funnel Conversion
    const funnelStages = {
      registered: registrations.length,
      shortlisted: registrations.filter((r) =>
        ['shortlisted', 'assessment', 'interview', 'selected', 'offered', 'accepted'].includes(
          r.currentStage
        )
      ).length,
      assessment: registrations.filter((r) =>
        ['assessment', 'interview', 'selected', 'offered', 'accepted'].includes(r.currentStage)
      ).length,
      interview: registrations.filter((r) =>
        ['interview', 'selected', 'offered', 'accepted'].includes(r.currentStage)
      ).length,
      selected: registrations.filter((r) =>
        ['selected', 'offered', 'accepted'].includes(r.currentStage)
      ).length,
      offered: registrations.filter((r) => ['offered', 'accepted'].includes(r.currentStage)).length,
      accepted: registrations.filter((r) => r.currentStage === 'accepted').length,
    };

    // 4. Common Skill Gaps across student group
    const skillFrequency = new Map<string, number>();
    for (const s of students) {
      for (const sk of s.skills || []) {
        const name = sk.name.trim();
        skillFrequency.set(name, (skillFrequency.get(name) || 0) + 1);
      }
    }

    const topIdentifiedSkills = Array.from(skillFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({
        skillName: name,
        studentCount: count,
        coveragePercentage: totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0,
      }));

    return {
      institution: {
        id: institution._id.toString(),
        name: institution.name,
      },
      totalStudents,
      departmentWise,
      graduationYearWise,
      funnelStages,
      topIdentifiedSkills,
    };
  }

  /**
   * 7. Safe CSV Export (with Formula Injection Defense)
   */
  public async exportPlacementDataCsv(
    actor: OfficerActor,
    exportType: 'students' | 'drives' | 'candidates',
    driveId?: string
  ): Promise<string> {
    const institution = await this.resolveOfficerInstitution(actor);

    // Formula injection sanitizer
    const sanitizeCsvCell = (val: unknown): string => {
      if (val === null || val === undefined) return '""';
      let str = String(val).replace(/"/g, '""');
      // If starts with =, +, -, @, tab, or carriage return, prepend with single quote
      if (/^[=+\-@\t\r]/.test(str)) {
        str = `'${str}`;
      }
      return `"${str}"`;
    };

    let csvContent = '';

    if (exportType === 'students') {
      const scopeFilter = await this.getStudentScopeFilter(institution);
      const students = await StudentProfile.find(scopeFilter)
        .select('fullName email department degree graduationYear completionPercentage placementStatus')
        .sort({ department: 1, fullName: 1 })
        .lean();

      const headers = [
        'Full Name',
        'Email Address',
        'Department',
        'Degree',
        'Graduation Year',
        'Profile Completion (%)',
        'Placement Status',
      ];
      const rows = students.map((s) => [
        sanitizeCsvCell(s.fullName),
        sanitizeCsvCell(s.email),
        sanitizeCsvCell(s.department),
        sanitizeCsvCell(s.degree),
        sanitizeCsvCell(s.graduationYear),
        sanitizeCsvCell(s.completionPercentage),
        sanitizeCsvCell(s.placementStatus || 'unplaced'),
      ]);

      csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    } else if (exportType === 'candidates' && driveId) {
      const candidates = await this.getDriveCandidates(actor, driveId);
      const headers = [
        'Candidate Name',
        'Email Address',
        'Department',
        'Degree',
        'Graduation Year',
        'Eligibility Status',
        'Current Stage',
        'Applied Date',
        'Offer Salary',
      ];
      const rows = candidates.map((c) => [
        sanitizeCsvCell(c.studentName),
        sanitizeCsvCell(c.studentEmail),
        sanitizeCsvCell(c.department),
        sanitizeCsvCell(c.degree),
        sanitizeCsvCell(c.graduationYear),
        sanitizeCsvCell(c.eligibilityStatus),
        sanitizeCsvCell(c.currentStage),
        sanitizeCsvCell(new Date(c.appliedDate).toISOString().split('T')[0]),
        sanitizeCsvCell(c.offerDetails?.salary || 'N/A'),
      ]);

      csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    } else {
      // Export drives
      const drives = await PlacementDrive.find({ institutionId: institution._id })
        .sort({ registrationDeadline: 1 })
        .lean();

      const headers = [
        'Company Name',
        'Drive Title',
        'Job Role',
        'Employment Type',
        'Work Mode',
        'Status',
        'Registration Deadline',
        'Location',
      ];
      const rows = drives.map((d) => [
        sanitizeCsvCell(d.companyName),
        sanitizeCsvCell(d.driveTitle),
        sanitizeCsvCell(d.jobRole),
        sanitizeCsvCell(d.employmentType),
        sanitizeCsvCell(d.workMode),
        sanitizeCsvCell(d.status),
        sanitizeCsvCell(new Date(d.registrationDeadline).toISOString().split('T')[0]),
        sanitizeCsvCell(d.location),
      ]);

      csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    }

    await auditLogService.logEvent({
      eventType: 'placement_report_exported',
      actor,
      action: `Exported ${exportType} CSV placement dataset`,
      metadata: { institutionId: institution._id.toString(), exportType },
    });

    return csvContent;
  }

  /**
   * 8. Placement Announcements
   */
  public async getAnnouncements(actor: OfficerActor) {
    const institution = await this.resolveOfficerInstitution(actor);
    const announcements = await PlacementAnnouncement.find({
      institutionId: institution._id,
      isActive: true,
    })
      .populate('relatedDriveId', 'companyName driveTitle')
      .sort({ publicationDate: -1 })
      .lean();

    return announcements.map((a) => ({
      id: a._id.toString(),
      title: a.title,
      content: a.content,
      relatedDrive: a.relatedDriveId
        ? {
            id: (a.relatedDriveId as any)._id?.toString(),
            title: (a.relatedDriveId as any).driveTitle,
            company: (a.relatedDriveId as any).companyName,
          }
        : null,
      targetDepartments: a.targetDepartments || [],
      targetGraduationYears: a.targetGraduationYears || [],
      publicationDate: a.publicationDate,
      expirationDate: a.expirationDate,
    }));
  }

  public async createAnnouncement(actor: OfficerActor, payload: Partial<IPlacementAnnouncement>) {
    const institution = await this.resolveOfficerInstitution(actor);

    const announcement = new PlacementAnnouncement({
      institutionId: institution._id,
      title: (payload.title || '').trim(),
      content: (payload.content || '').trim(),
      relatedDriveId: payload.relatedDriveId ? new Types.ObjectId(payload.relatedDriveId) : undefined,
      targetDepartments: payload.targetDepartments || [],
      targetGraduationYears: payload.targetGraduationYears || [],
      publicationDate: payload.publicationDate || new Date(),
      expirationDate: payload.expirationDate,
      isActive: true,
      createdBy: new Types.ObjectId(actor.id),
    });

    await announcement.save();

    await auditLogService.logEvent({
      eventType: 'announcement_created',
      actor,
      action: `Created placement announcement "${announcement.title}"`,
      targetId: announcement._id.toString(),
      targetType: 'PlacementAnnouncement',
      metadata: { institutionId: institution._id.toString() },
    });

    return announcement;
  }
}

export const placementOfficerService = new PlacementOfficerService();
