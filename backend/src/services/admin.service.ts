import { Types, FilterQuery } from 'mongoose';
import { User, IUser } from '../models/user.model';
import { StudentProfile, IStudentProfile } from '../models/studentProfile.model';
import { JobOpportunity, IJobOpportunity, JobStatus } from '../models/jobOpportunity.model';
import { CareerRole, ICareerRole } from '../models/careerRole.model';
import { LearningResource, ILearningResource } from '../models/learningResource.model';
import { PlatformSettings, IPlatformSettings } from '../models/platformSettings.model';
import { Institution } from '../models/institution.model';
import { CareerAnalysis } from '../models/careerAnalysis.model';
import { LearningRoadmap } from '../models/learningRoadmap.model';
import { ResumeDocument } from '../models/resumeDocument.model';
import { InterviewSession } from '../models/interviewSession.model';
import { JobApplication } from '../models/jobApplication.model';
import { auditLogService } from './auditLog.service';
import { llmService } from './ai';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';
import { VERIFIED_RESOURCE_CATALOG } from '../config/learningResources.data';

export interface AdminActor {
  id: string;
  email: string;
  name: string;
}

export interface OverviewMetrics {
  totalStudents: number;
  activeStudents: number;
  suspendedStudents: number;
  newRegistrationsLast30Days: number;
  totalJobs: number;
  totalInternships: number;
  careerAnalysesCompleted: number;
  roadmapsGenerated: number;
  resumesCreated: number;
  mockInterviewsCompleted: number;
  applicationsTracked: number;
  systemHealth: {
    status: 'healthy' | 'degraded';
    aiProvider: string;
    aiConfigured: boolean;
    aiSimulated: boolean;
  };
  recentActivities: Array<{
    id: string;
    eventType: string;
    action: string;
    actorEmail: string;
    createdAt: Date;
    status: string;
  }>;
}

export interface StudentListQuery {
  page?: number;
  limit?: number;
  search?: string;
  department?: string;
  graduationYear?: number;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SafeStudentSummary {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'suspended';
  createdAt: Date;
  lastLoginAt?: Date;
  profile?: {
    college?: string;
    degree?: string;
    department?: string;
    graduationYear?: number;
    completionPercentage: number;
    skillsCount: number;
    projectsCount: number;
    targetRoles: string[];
  };
}

export class AdminService {
  /**
   * Calculates comprehensive overview metrics directly from database collections
   */
  public async getOverviewMetrics(): Promise<OverviewMetrics> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalStudents,
      activeStudents,
      suspendedStudents,
      newRegistrationsLast30Days,
      totalJobs,
      totalInternships,
      careerAnalysesCompleted,
      roadmapsGenerated,
      resumesCreated,
      mockInterviewsCompleted,
      applicationsTracked,
      recentLogs,
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'student', status: 'active' }),
      User.countDocuments({ role: 'student', status: 'suspended' }),
      User.countDocuments({ role: 'student', createdAt: { $gte: thirtyDaysAgo } }),
      JobOpportunity.countDocuments({ employmentType: { $ne: 'Internship' } }),
      JobOpportunity.countDocuments({ employmentType: 'Internship' }),
      CareerAnalysis.countDocuments(),
      LearningRoadmap.countDocuments(),
      ResumeDocument.countDocuments(),
      InterviewSession.countDocuments({ status: 'completed' }),
      JobApplication.countDocuments(),
      auditLogService.getRecentLogs(6),
    ]);

    const aiStatus = llmService.getStatus();

    return {
      totalStudents,
      activeStudents,
      suspendedStudents,
      newRegistrationsLast30Days,
      totalJobs,
      totalInternships,
      careerAnalysesCompleted,
      roadmapsGenerated,
      resumesCreated,
      mockInterviewsCompleted,
      applicationsTracked,
      systemHealth: {
        status: 'healthy',
        aiProvider: aiStatus.activeProvider,
        aiConfigured: aiStatus.isConfigured,
        aiSimulated: aiStatus.isSimulated,
      },
      recentActivities: recentLogs.map((l) => ({
        id: l._id.toString(),
        eventType: l.eventType,
        action: l.action,
        actorEmail: l.actorEmail,
        createdAt: l.createdAt,
        status: l.status,
      })),
    };
  }

  /**
   * Retrieves paginated students with safe field projections and filters
   */
  public async getStudents(query: StudentListQuery): Promise<{
    students: SafeStudentSummary[];
    pagination: {
      page: number;
      limit: number;
      totalCount: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 15));
    const skip = (page - 1) * limit;

    const userFilter: FilterQuery<IUser> = { role: 'student' };

    if (query.status && query.status !== 'all') {
      userFilter.status = query.status;
    }

    if (query.search) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      userFilter.$or = [{ name: searchRegex }, { email: searchRegex }];
    }

    // Profile field filters
    let profileUserIds: Types.ObjectId[] | null = null;
    if (query.department || query.graduationYear) {
      const profileFilter: FilterQuery<IStudentProfile> = {};
      if (query.department && query.department !== 'all') {
        profileFilter.department = new RegExp(query.department.trim(), 'i');
      }
      if (query.graduationYear) {
        profileFilter.graduationYear = Number(query.graduationYear);
      }
      const matchedProfiles = await StudentProfile.find(profileFilter).select('user').lean();
      profileUserIds = matchedProfiles.map((p) => p.user);
      userFilter._id = { $in: profileUserIds };
    }

    const sortOption: Record<string, 1 | -1> = {};
    if (query.sortBy === 'name') {
      sortOption.name = query.sortOrder === 'desc' ? -1 : 1;
    } else {
      sortOption.createdAt = query.sortOrder === 'asc' ? 1 : -1;
    }

    const [users, totalCount] = await Promise.all([
      User.find(userFilter)
        .select('_id name email role status createdAt lastLoginAt profileId')
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(userFilter),
    ]);

    // Fetch corresponding profiles for selected users
    const userIds = users.map((u) => u._id);
    const profiles = await StudentProfile.find({ user: { $in: userIds } }).lean();
    const profileMap = new Map(profiles.map((p) => [p.user.toString(), p]));

    const students: SafeStudentSummary[] = users.map((u) => {
      const prof = profileMap.get(u._id.toString());
      return {
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status || 'active',
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt,
        profile: prof
          ? {
              college: prof.college,
              degree: prof.degree,
              department: prof.department,
              graduationYear: prof.graduationYear,
              completionPercentage: prof.completionPercentage || 0,
              skillsCount: prof.skills?.length || 0,
              projectsCount: prof.projects?.length || 0,
              targetRoles: prof.careerInterests?.targetRoles || [],
            }
          : undefined,
      };
    });

    const totalPages = Math.ceil(totalCount / limit) || 1;

    return {
      students,
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
   * Retrieves single student record summary with placement context
   */
  public async getStudentDetail(studentId: string): Promise<Record<string, unknown>> {
    if (!Types.ObjectId.isValid(studentId)) {
      throw AppError.badRequest('Invalid student ID format');
    }

    const user = await User.findById(studentId).select('_id name email role status createdAt lastLoginAt').lean();
    if (!user) {
      throw AppError.notFound('Student account not found');
    }

    const userObjectId = new Types.ObjectId(studentId);

    const [profile, latestAnalysis, roadmap, applications, interviewStats] = await Promise.all([
      StudentProfile.findOne({ user: userObjectId }).lean(),
      CareerAnalysis.findOne({ user: userObjectId }).sort({ createdAt: -1 }).select('targetRole scores createdAt').lean(),
      LearningRoadmap.findOne({ user: userObjectId }).select('targetRole totalTasks completedTasks overallProgress').lean(),
      JobApplication.find({ user: userObjectId }).select('status company jobTitle appliedDate').lean(),
      InterviewSession.find({ user: userObjectId, status: 'completed' }).select('targetRole summary.overallScore completedAt').lean(),
    ]);

    const activeApplications = applications.filter((a) =>
      ['Applied', 'Assessment', 'Interview'].includes(a.status)
    ).length;

    const avgInterviewScore =
      interviewStats.length > 0
        ? Math.round(
            interviewStats.reduce((acc, s) => acc + (s.summary?.overallScore || 0), 0) /
              interviewStats.length
          )
        : 0;

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status || 'active',
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      profile: profile
        ? {
            id: profile._id.toString(),
            fullName: profile.fullName,
            college: profile.college,
            degree: profile.degree,
            department: profile.department,
            graduationYear: profile.graduationYear,
            headline: profile.headline,
            completionPercentage: profile.completionPercentage || 0,
            skills: (profile.skills || []).map((s) => ({ name: s.name, level: s.proficiency })),
            projectsCount: profile.projects?.length || 0,
            targetRoles: profile.careerInterests?.targetRoles || [],
          }
        : null,
      careerReadiness: latestAnalysis
        ? {
            targetRole: latestAnalysis.targetRole?.title,
            readinessScore: latestAnalysis.scores?.readinessScore,
            skillMatchScore: latestAnalysis.scores?.skillMatchScore,
            analyzedAt: latestAnalysis.createdAt,
          }
        : null,
      roadmapProgress: roadmap
        ? {
            targetRole: roadmap.targetRole?.title,
            totalTasks: roadmap.totalTasks,
            completedTasks: roadmap.completedTasks,
            overallProgress: roadmap.overallProgress,
          }
        : null,
      placementTracker: {
        totalApplications: applications.length,
        activeApplications,
        stageBreakdown: {
          saved: applications.filter((a) => a.status === 'Saved').length,
          applied: applications.filter((a) => a.status === 'Applied').length,
          assessment: applications.filter((a) => a.status === 'Assessment').length,
          interview: applications.filter((a) => a.status === 'Interview').length,
          offer: applications.filter((a) => a.status === 'Offer').length,
          rejected: applications.filter((a) => a.status === 'Rejected').length,
        },
      },
      mockInterviewSummary: {
        completedSessions: interviewStats.length,
        averageScore: avgInterviewScore,
      },
    };
  }

  /**
   * Suspends or activates a student account with self-suspension and last-admin protection
   */
  public async updateAccountStatus(
    targetUserId: string,
    status: 'active' | 'suspended',
    actor: AdminActor,
    reason?: string
  ): Promise<IUser> {
    if (!Types.ObjectId.isValid(targetUserId)) {
      throw AppError.badRequest('Invalid user ID format');
    }

    if (actor.id === targetUserId) {
      throw AppError.badRequest('You cannot modify the status of your own account.');
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      throw AppError.notFound('Target user not found');
    }

    // Protection: Never suspend the last active administrator
    if (targetUser.role === 'admin' && status === 'suspended') {
      const activeAdminCount = await User.countDocuments({ role: 'admin', status: 'active' });
      if (activeAdminCount <= 1) {
        throw AppError.badRequest('Cannot suspend the last active administrator on the platform.');
      }
    }

    const previousStatus = targetUser.status || 'active';
    targetUser.status = status;
    await targetUser.save();

    await auditLogService.logEvent({
      eventType: 'student_status_change',
      actor,
      action: `Changed status of ${targetUser.email} from ${previousStatus} to ${status}`,
      targetId: targetUser._id.toString(),
      targetType: 'User',
      metadata: { previousStatus, newStatus: status, reason },
    });

    return targetUser;
  }

  /**
   * Provisions a new administrator account (requires authenticated admin)
   */
  public async provisionAdmin(
    data: { name: string; email: string; password: string },
    actor: AdminActor
  ): Promise<{ id: string; name: string; email: string; role: string; createdAt: Date }> {
    const normalizedEmail = data.email.toLowerCase().trim();

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      throw AppError.conflict('An account with this email address already exists.');
    }

    const adminUser = new User({
      name: data.name.trim(),
      email: normalizedEmail,
      password: data.password,
      role: 'admin',
      status: 'active',
      lastLoginAt: new Date(),
    });

    await adminUser.save();

    await auditLogService.logEvent({
      eventType: 'admin_provisioned',
      actor,
      action: `Provisioned new administrator account for ${normalizedEmail}`,
      targetId: adminUser._id.toString(),
      targetType: 'User',
      metadata: { name: adminUser.name, email: adminUser.email },
    });

    return {
      id: adminUser._id.toString(),
      name: adminUser.name,
      email: adminUser.email,
      role: adminUser.role,
      createdAt: adminUser.createdAt,
    };
  }

  /**
   * Provisions a new Placement Officer account (requires authenticated admin)
   */
  public async provisionPlacementOfficer(
    data: {
      name: string;
      email: string;
      password: string;
      institutionId?: string;
      department?: string;
    },
    actor: AdminActor
  ): Promise<{ id: string; name: string; email: string; role: string; institutionId?: string; createdAt: Date }> {
    const normalizedEmail = data.email.toLowerCase().trim();

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      throw AppError.conflict('An account with this email address already exists.');
    }

    let institution = null;
    if (data.institutionId && Types.ObjectId.isValid(data.institutionId)) {
      institution = await Institution.findById(data.institutionId);
    }
    if (!institution) {
      institution = await Institution.findOne({ isActive: true });
      if (!institution) {
        institution = await Institution.create({
          name: 'Apex Institute of Technology',
          code: 'AIT',
          domain: 'apex.edu',
          isActive: true,
        });
      }
    }

    const officerUser = new User({
      name: data.name.trim(),
      email: normalizedEmail,
      password: data.password,
      role: 'placement_officer',
      status: 'active',
      institutionId: institution._id,
      assignedDepartment: data.department?.trim(),
      lastLoginAt: new Date(),
    });

    await officerUser.save();

    await auditLogService.logEvent({
      eventType: 'placement_officer_provisioned',
      actor,
      action: `Provisioned new placement officer account for ${normalizedEmail} at ${institution.name}`,
      targetId: officerUser._id.toString(),
      targetType: 'User',
      metadata: {
        name: officerUser.name,
        email: officerUser.email,
        institutionId: institution._id.toString(),
      },
    });

    return {
      id: officerUser._id.toString(),
      name: officerUser.name,
      email: officerUser.email,
      role: officerUser.role,
      institutionId: institution._id.toString(),
      createdAt: officerUser.createdAt,
    };
  }

  // ==========================================
  // JOB & INTERNSHIP MANAGEMENT
  // ==========================================

  public async getAdminJobs(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    employmentType?: string;
    workMode?: string;
  }): Promise<{
    jobs: IJobOpportunity[];
    pagination: {
      page: number;
      limit: number;
      totalCount: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 15));
    const skip = (page - 1) * limit;

    const filter: FilterQuery<IJobOpportunity> = {};

    if (query.status && query.status !== 'all') {
      filter.status = query.status;
    }

    if (query.employmentType && query.employmentType !== 'all') {
      filter.employmentType = query.employmentType;
    }

    if (query.workMode && query.workMode !== 'all') {
      filter.workMode = query.workMode;
    }

    if (query.search) {
      const regex = new RegExp(query.search.trim(), 'i');
      filter.$or = [{ title: regex }, { company: regex }, { roleCategory: regex }, { location: regex }];
    }

    const [jobs, totalCount] = await Promise.all([
      JobOpportunity.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      JobOpportunity.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalCount / limit) || 1;

    return {
      jobs: jobs as unknown as IJobOpportunity[],
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

  public async createJob(payload: Record<string, unknown>, actor: AdminActor): Promise<IJobOpportunity> {
    const title = String(payload.title || '').trim();
    const company = String(payload.company || '').trim();

    if (!title || !company) {
      throw AppError.badRequest('Job title and company name are required.');
    }

    // Generate unique slug
    const baseSlug = `${title}-${company}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    let slug = baseSlug;
    let counter = 1;
    while (await JobOpportunity.findOne({ slug })) {
      slug = `${baseSlug}-${counter++}`;
    }

    const job = new JobOpportunity({
      ...payload,
      title,
      company,
      slug,
      status: (payload.status as JobStatus) || 'published',
      publicationDate: payload.publicationDate ? new Date(payload.publicationDate as string) : new Date(),
    });

    await job.save();

    await auditLogService.logEvent({
      eventType: 'job_created',
      actor,
      action: `Created job listing "${job.title}" at ${job.company}`,
      targetId: job._id.toString(),
      targetType: 'JobOpportunity',
      metadata: { slug: job.slug, status: job.status, isVerified: job.isVerifiedVacancy },
    });

    return job;
  }

  public async updateJob(id: string, payload: Record<string, unknown>, actor: AdminActor): Promise<IJobOpportunity> {
    if (!Types.ObjectId.isValid(id)) {
      throw AppError.badRequest('Invalid job ID format');
    }

    const job = await JobOpportunity.findById(id);
    if (!job) {
      throw AppError.notFound('Job listing not found');
    }

    Object.assign(job, payload);
    await job.save();

    await auditLogService.logEvent({
      eventType: 'job_updated',
      actor,
      action: `Updated job listing "${job.title}" at ${job.company}`,
      targetId: job._id.toString(),
      targetType: 'JobOpportunity',
      metadata: { status: job.status },
    });

    return job;
  }

  public async updateJobStatus(id: string, status: JobStatus, actor: AdminActor): Promise<IJobOpportunity> {
    if (!Types.ObjectId.isValid(id)) {
      throw AppError.badRequest('Invalid job ID format');
    }

    const job = await JobOpportunity.findById(id);
    if (!job) {
      throw AppError.notFound('Job listing not found');
    }

    const oldStatus = job.status;
    job.status = status;
    await job.save();

    await auditLogService.logEvent({
      eventType: 'job_status_change',
      actor,
      action: `Changed job "${job.title}" status from ${oldStatus} to ${status}`,
      targetId: job._id.toString(),
      targetType: 'JobOpportunity',
      metadata: { oldStatus, newStatus: status },
    });

    return job;
  }

  public async deleteJob(id: string, actor: AdminActor): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw AppError.badRequest('Invalid job ID format');
    }

    const job = await JobOpportunity.findById(id);
    if (!job) {
      throw AppError.notFound('Job listing not found');
    }

    await JobOpportunity.findByIdAndDelete(id);

    await auditLogService.logEvent({
      eventType: 'job_deleted',
      actor,
      action: `Deleted job listing "${job.title}" at ${job.company}`,
      targetId: id,
      targetType: 'JobOpportunity',
      metadata: { title: job.title, company: job.company },
    });
  }

  // ==========================================
  // CAREER ROLE CATALOG MANAGEMENT
  // ==========================================

  public async getCareerRoles(): Promise<ICareerRole[]> {
    return CareerRole.find().sort({ title: 1 });
  }

  public async createCareerRole(payload: Record<string, unknown>, actor: AdminActor): Promise<ICareerRole> {
    const title = String(payload.title || '').trim();
    if (!title) {
      throw AppError.badRequest('Role title is required');
    }

    const slug = (
      (payload.slug as string) ||
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
    ).trim();

    const existing = await CareerRole.findOne({ $or: [{ slug }, { title }] });
    if (existing) {
      throw AppError.conflict('A career role with this title or slug already exists.');
    }

    const role = new CareerRole({
      ...payload,
      title,
      slug,
      isActive: payload.isActive !== false,
      isStandard: false,
    });

    await role.save();

    await auditLogService.logEvent({
      eventType: 'career_role_created',
      actor,
      action: `Created new career role "${role.title}"`,
      targetId: role._id.toString(),
      targetType: 'CareerRole',
      metadata: { slug: role.slug },
    });

    return role;
  }

  public async updateCareerRole(
    idOrSlug: string,
    payload: Record<string, unknown>,
    actor: AdminActor
  ): Promise<ICareerRole> {
    const role = await CareerRole.findOne({
      $or: [{ slug: idOrSlug.toLowerCase() }, ...(Types.ObjectId.isValid(idOrSlug) ? [{ _id: idOrSlug }] : [])],
    });

    if (!role) {
      throw AppError.notFound('Career role not found in catalog');
    }

    Object.assign(role, payload);
    await role.save();

    await auditLogService.logEvent({
      eventType: 'career_role_updated',
      actor,
      action: `Updated career role "${role.title}"`,
      targetId: role._id.toString(),
      targetType: 'CareerRole',
      metadata: { slug: role.slug, isActive: role.isActive },
    });

    return role;
  }

  public async toggleCareerRoleStatus(idOrSlug: string, actor: AdminActor): Promise<ICareerRole> {
    const role = await CareerRole.findOne({
      $or: [{ slug: idOrSlug.toLowerCase() }, ...(Types.ObjectId.isValid(idOrSlug) ? [{ _id: idOrSlug }] : [])],
    });

    if (!role) {
      throw AppError.notFound('Career role not found in catalog');
    }

    role.isActive = !role.isActive;
    await role.save();

    await auditLogService.logEvent({
      eventType: 'career_role_status_change',
      actor,
      action: `Toggled career role "${role.title}" active status to ${role.isActive}`,
      targetId: role._id.toString(),
      targetType: 'CareerRole',
      metadata: { slug: role.slug, isActive: role.isActive },
    });

    return role;
  }

  // ==========================================
  // LEARNING RESOURCE MANAGEMENT
  // ==========================================

  public async seedDefaultResourcesIfEmpty(): Promise<void> {
    try {
      const count = await LearningResource.countDocuments();
      if (count > 0) return;

      logger.info('[AdminService] Seeding verified learning resources catalog into MongoDB...');
      const docsToInsert: Array<Record<string, unknown>> = [];

      for (const [skillKey, resources] of Object.entries(VERIFIED_RESOURCE_CATALOG)) {
        for (const res of resources) {
          docsToInsert.push({
            title: res.title,
            description: `Curated learning guide and reference for ${skillKey} proficiency.`,
            topic: skillKey,
            relatedSkill: skillKey,
            resourceUrl: res.url,
            resourceType: res.type,
            difficulty: 'All Levels',
            estimatedDurationMinutes: 60,
            publicationStatus: 'published',
            isFree: res.isFree,
            provider: res.provider,
            isVerified: true,
            verificationDate: new Date(),
          });
        }
      }

      if (docsToInsert.length > 0) {
        await LearningResource.insertMany(docsToInsert);
        logger.info(`[AdminService] Seeded ${docsToInsert.length} verified learning resources.`);
      }
    } catch (err) {
      logger.warn('[AdminService] Error checking/seeding learning resources:', (err as Error).message);
    }
  }

  public async getLearningResources(query: {
    page?: number;
    limit?: number;
    search?: string;
    topic?: string;
    relatedSkill?: string;
    publicationStatus?: string;
  }): Promise<{
    resources: ILearningResource[];
    pagination: {
      page: number;
      limit: number;
      totalCount: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }> {
    await this.seedDefaultResourcesIfEmpty();

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 15));
    const skip = (page - 1) * limit;

    const filter: FilterQuery<ILearningResource> = {};

    if (query.publicationStatus && query.publicationStatus !== 'all') {
      filter.publicationStatus = query.publicationStatus;
    }

    if (query.topic && query.topic !== 'all') {
      filter.topic = new RegExp(query.topic.trim(), 'i');
    }

    if (query.relatedSkill && query.relatedSkill !== 'all') {
      filter.relatedSkill = query.relatedSkill.toLowerCase().trim();
    }

    if (query.search) {
      const regex = new RegExp(query.search.trim(), 'i');
      filter.$or = [{ title: regex }, { description: regex }, { provider: regex }, { topic: regex }];
    }

    const [resources, totalCount] = await Promise.all([
      LearningResource.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      LearningResource.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalCount / limit) || 1;

    return {
      resources: resources as unknown as ILearningResource[],
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

  public async createLearningResource(payload: Record<string, unknown>, actor: AdminActor): Promise<ILearningResource> {
    const title = String(payload.title || '').trim();
    const resourceUrl = String(payload.resourceUrl || '').trim();

    if (!title || !resourceUrl) {
      throw AppError.badRequest('Resource title and URL are required.');
    }

    const resource = new LearningResource({
      ...payload,
      title,
      resourceUrl,
      isVerified: payload.isVerified === true,
      verificationDate: payload.isVerified ? new Date() : null,
    });

    await resource.save();

    await auditLogService.logEvent({
      eventType: 'learning_resource_created',
      actor,
      action: `Created learning resource "${resource.title}"`,
      targetId: resource._id.toString(),
      targetType: 'LearningResource',
      metadata: { topic: resource.topic, isVerified: resource.isVerified },
    });

    return resource;
  }

  public async updateLearningResource(
    id: string,
    payload: Record<string, unknown>,
    actor: AdminActor
  ): Promise<ILearningResource> {
    if (!Types.ObjectId.isValid(id)) {
      throw AppError.badRequest('Invalid resource ID format');
    }

    const resource = await LearningResource.findById(id);
    if (!resource) {
      throw AppError.notFound('Learning resource not found');
    }

    if (payload.isVerified === true && !resource.isVerified) {
      payload.verificationDate = new Date();
    }

    Object.assign(resource, payload);
    await resource.save();

    await auditLogService.logEvent({
      eventType: 'learning_resource_updated',
      actor,
      action: `Updated learning resource "${resource.title}"`,
      targetId: resource._id.toString(),
      targetType: 'LearningResource',
      metadata: { publicationStatus: resource.publicationStatus },
    });

    return resource;
  }

  public async deleteLearningResource(id: string, actor: AdminActor): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw AppError.badRequest('Invalid resource ID format');
    }

    const resource = await LearningResource.findById(id);
    if (!resource) {
      throw AppError.notFound('Learning resource not found');
    }

    await LearningResource.findByIdAndDelete(id);

    await auditLogService.logEvent({
      eventType: 'learning_resource_deleted',
      actor,
      action: `Deleted learning resource "${resource.title}"`,
      targetId: id,
      targetType: 'LearningResource',
      metadata: { title: resource.title },
    });
  }

  // ==========================================
  // PLATFORM SETTINGS
  // ==========================================

  public async getSettings(): Promise<IPlatformSettings> {
    let settings = await PlatformSettings.findOne();
    if (!settings) {
      settings = await PlatformSettings.create({
        platformName: 'Career Pilot AI',
        supportEmail: 'support@careerpilot.ai',
        jobPublicationRules: {
          requireAdminApproval: true,
          autoArchiveExpiredDays: 30,
          allowStudentSubmissions: false,
        },
        learningResourceVisibility: {
          requireVerificationToPublish: true,
          showFreeOnlyByDefault: false,
        },
        notificationPreferences: {
          notifyOnNewRegistrations: true,
          notifyOnJobApplicationSubmissions: false,
        },
      });
    }
    return settings;
  }

  public async updateSettings(payload: Record<string, unknown>, actor: AdminActor): Promise<IPlatformSettings> {
    let settings = await PlatformSettings.findOne();
    if (!settings) {
      settings = new PlatformSettings();
    }

    if (payload.platformName) settings.platformName = String(payload.platformName).trim();
    if (payload.supportEmail) settings.supportEmail = String(payload.supportEmail).trim();
    if (payload.systemNotice !== undefined) settings.systemNotice = String(payload.systemNotice).trim();

    if (payload.jobPublicationRules && typeof payload.jobPublicationRules === 'object') {
      settings.jobPublicationRules = {
        ...settings.jobPublicationRules,
        ...(payload.jobPublicationRules as Record<string, boolean | number>),
      };
    }

    if (payload.learningResourceVisibility && typeof payload.learningResourceVisibility === 'object') {
      settings.learningResourceVisibility = {
        ...settings.learningResourceVisibility,
        ...(payload.learningResourceVisibility as Record<string, boolean>),
      };
    }

    if (payload.notificationPreferences && typeof payload.notificationPreferences === 'object') {
      settings.notificationPreferences = {
        ...settings.notificationPreferences,
        ...(payload.notificationPreferences as Record<string, boolean>),
      };
    }

    settings.updatedBy = new Types.ObjectId(actor.id);
    await settings.save();

    await auditLogService.logEvent({
      eventType: 'settings_updated',
      actor,
      action: `Updated platform configuration settings`,
      targetId: settings._id.toString(),
      targetType: 'PlatformSettings',
      metadata: { platformName: settings.platformName },
    });

    return settings;
  }
}

export const adminService = new AdminService();

