import { Types } from 'mongoose';
import {
  JobApplication,
  IJobApplication,
  ApplicationStatus,
} from '../models/jobApplication.model';
import { JobOpportunity } from '../models/jobOpportunity.model';
import { AppError } from '../utils/appError';

export interface CreateApplicationInput {
  company?: string;
  jobTitle?: string;
  jobOpportunity?: string;
  applicationUrl?: string;
  status?: ApplicationStatus;
  appliedDate?: Date | string | null;
  interviewDate?: Date | string | null;
  deadline?: Date | string | null;
  followUpDate?: Date | string | null;
  notes?: string;
  location?: string;
  employmentType?: string;
  workMode?: string;
  compensation?: string;
}

export interface UpdateApplicationInput {
  company?: string;
  jobTitle?: string;
  applicationUrl?: string;
  status?: ApplicationStatus;
  appliedDate?: Date | string | null;
  interviewDate?: Date | string | null;
  deadline?: Date | string | null;
  followUpDate?: Date | string | null;
  notes?: string;
  location?: string;
  employmentType?: string;
  workMode?: string;
  compensation?: string;
}

export interface ApplicationQueryFilters {
  status?: ApplicationStatus | 'all';
  search?: string;
  sortBy?: 'appliedDate' | 'deadline' | 'interviewDate' | 'updatedAt' | 'company';
  sortOrder?: 'asc' | 'desc';
}

export interface ApplicationStatsSummary {
  total: number;
  saved: number;
  applied: number;
  assessment: number;
  interview: number;
  offer: number;
  rejected: number;
  withdrawn: number;
  activePipeline: number;
  responseRate: number;
  upcomingInterviews: IJobApplication[];
  overdueFollowUps: IJobApplication[];
}

export class JobApplicationService {
  /**
   * Tracks a new job or internship application.
   */
  public async createApplication(
    userId: string,
    input: CreateApplicationInput
  ): Promise<IJobApplication> {
    const userObjectId = new Types.ObjectId(userId);
    let company = input.company?.trim();
    let jobTitle = input.jobTitle?.trim();
    let location = input.location?.trim() || '';
    let employmentType = input.employmentType?.trim() || '';
    let workMode = input.workMode?.trim() || '';
    let compensation = input.compensation?.trim() || '';
    let applicationUrl = input.applicationUrl?.trim() || '';
    let jobOpportunityId: Types.ObjectId | null = null;

    // If linked to a JobOpportunity, auto-populate details
    if (input.jobOpportunity && Types.ObjectId.isValid(input.jobOpportunity)) {
      jobOpportunityId = new Types.ObjectId(input.jobOpportunity);
      const opportunity = await JobOpportunity.findById(jobOpportunityId);
      if (opportunity) {
        if (!company) company = opportunity.company;
        if (!jobTitle) jobTitle = opportunity.title;
        if (!location) location = opportunity.location;
        if (!employmentType) employmentType = opportunity.employmentType;
        if (!workMode) workMode = opportunity.workMode;
        if (!compensation && opportunity.compensation?.amount) {
          compensation = `${opportunity.compensation.amount} ${opportunity.compensation.currency}`;
        }
        if (!applicationUrl) applicationUrl = opportunity.applicationUrl;

        // Check for duplicate active application to the exact same opportunity
        const existingOpportunityApp = await JobApplication.findOne({
          user: userObjectId,
          jobOpportunity: jobOpportunityId,
          status: { $nin: ['Rejected', 'Withdrawn'] },
        });

        if (existingOpportunityApp) {
          throw new AppError(
            `You already have an active application for "${jobTitle}" at ${company} (Current Status: ${existingOpportunityApp.status}).`,
            409
          );
        }
      }
    }

    if (!company) {
      throw new AppError('Company name is required.', 400);
    }
    if (!jobTitle) {
      throw new AppError('Job title is required.', 400);
    }

    const status: ApplicationStatus = input.status || 'Applied';
    const appliedDate = input.appliedDate ? new Date(input.appliedDate) : new Date();

    const application = new JobApplication({
      user: userObjectId,
      company,
      jobTitle,
      jobOpportunity: jobOpportunityId,
      applicationUrl,
      status,
      appliedDate,
      interviewDate: input.interviewDate ? new Date(input.interviewDate) : undefined,
      deadline: input.deadline ? new Date(input.deadline) : undefined,
      followUpDate: input.followUpDate ? new Date(input.followUpDate) : undefined,
      notes: input.notes?.trim() || '',
      location,
      employmentType,
      workMode,
      compensation,
      statusHistory: [
        {
          status,
          changedAt: new Date(),
          notes: input.notes?.trim() || 'Application tracked in pipeline',
        },
      ],
    });

    await application.save();
    return application;
  }

  /**
   * Retrieves applications for the student with filtering, searching, and sorting.
   */
  public async getApplications(
    userId: string,
    filters: ApplicationQueryFilters = {}
  ): Promise<IJobApplication[]> {
    const query: Record<string, unknown> = {
      user: new Types.ObjectId(userId),
    };

    if (filters.status && filters.status !== 'all') {
      query.status = filters.status;
    }

    if (filters.search && filters.search.trim()) {
      const searchRegex = new RegExp(filters.search.trim(), 'i');
      query.$or = [{ company: searchRegex }, { jobTitle: searchRegex }, { location: searchRegex }];
    }

    // Determine sort field and direction
    const sortField = filters.sortBy || 'appliedDate';
    const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;
    const sortObj: Record<string, 1 | -1> = { [sortField]: sortOrder };

    return JobApplication.find(query)
      .sort(sortObj)
      .populate('jobOpportunity', 'title company companyLogo location applicationUrl')
      .lean() as unknown as Promise<IJobApplication[]>;
  }

  /**
   * Retrieves a single application ensuring student ownership.
   */
  public async getApplicationById(id: string, userId: string): Promise<IJobApplication> {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid application ID format.', 400);
    }

    const application = await JobApplication.findById(id).populate(
      'jobOpportunity',
      'title company companyLogo location applicationUrl requirements'
    );

    if (!application) {
      throw new AppError('Job application not found.', 404);
    }

    if (application.user.toString() !== userId) {
      throw new AppError('You are not authorized to view this application.', 403);
    }

    return application;
  }

  /**
   * Updates an existing application and logs status transition history.
   */
  public async updateApplication(
    id: string,
    userId: string,
    updates: UpdateApplicationInput
  ): Promise<IJobApplication> {
    const application = await this.getApplicationById(id, userId);

    if (updates.company !== undefined) application.company = updates.company.trim();
    if (updates.jobTitle !== undefined) application.jobTitle = updates.jobTitle.trim();
    if (updates.applicationUrl !== undefined) application.applicationUrl = updates.applicationUrl.trim();
    if (updates.location !== undefined) application.location = updates.location.trim();
    if (updates.employmentType !== undefined) application.employmentType = updates.employmentType.trim();
    if (updates.workMode !== undefined) application.workMode = updates.workMode.trim();
    if (updates.compensation !== undefined) application.compensation = updates.compensation.trim();
    if (updates.notes !== undefined) application.notes = updates.notes.trim();

    if (updates.appliedDate !== undefined) {
      application.appliedDate = updates.appliedDate ? new Date(updates.appliedDate) : undefined;
    }
    if (updates.interviewDate !== undefined) {
      application.interviewDate = updates.interviewDate ? new Date(updates.interviewDate) : undefined;
    }
    if (updates.deadline !== undefined) {
      application.deadline = updates.deadline ? new Date(updates.deadline) : undefined;
    }
    if (updates.followUpDate !== undefined) {
      application.followUpDate = updates.followUpDate ? new Date(updates.followUpDate) : undefined;
    }

    // Check if status is updated
    if (updates.status && updates.status !== application.status) {
      const validStatuses: ApplicationStatus[] = [
        'Saved',
        'Applied',
        'Assessment',
        'Interview',
        'Offer',
        'Rejected',
        'Withdrawn',
      ];
      if (!validStatuses.includes(updates.status)) {
        throw new AppError(`Invalid status '${updates.status}'.`, 400);
      }

      application.status = updates.status;
      application.statusHistory.push({
        status: updates.status,
        changedAt: new Date(),
        notes: updates.notes?.trim() || `Status updated to ${updates.status}`,
      });
    }

    await application.save();
    return application;
  }

  /**
   * Deletes a tracked application.
   */
  public async deleteApplication(id: string, userId: string): Promise<void> {
    const application = await this.getApplicationById(id, userId);
    await application.deleteOne();
  }

  /**
   * Computes comprehensive application statistics, response rate, upcoming interviews, and overdue follow-ups.
   */
  public async getApplicationStats(userId: string): Promise<ApplicationStatsSummary> {
    const applications = await JobApplication.find({
      user: new Types.ObjectId(userId),
    }).sort({ appliedDate: -1 });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    let saved = 0;
    let applied = 0;
    let assessment = 0;
    let interview = 0;
    let offer = 0;
    let rejected = 0;
    let withdrawn = 0;

    const upcomingInterviews: IJobApplication[] = [];
    const overdueFollowUps: IJobApplication[] = [];

    for (const app of applications) {
      switch (app.status) {
        case 'Saved':
          saved++;
          break;
        case 'Applied':
          applied++;
          break;
        case 'Assessment':
          assessment++;
          break;
        case 'Interview':
          interview++;
          break;
        case 'Offer':
          offer++;
          break;
        case 'Rejected':
          rejected++;
          break;
        case 'Withdrawn':
          withdrawn++;
          break;
      }

      // Check upcoming interviews
      if (
        app.interviewDate &&
        new Date(app.interviewDate) >= startOfToday &&
        app.status !== 'Rejected' &&
        app.status !== 'Withdrawn'
      ) {
        upcomingInterviews.push(app);
      }

      // Check overdue follow-ups
      if (
        app.followUpDate &&
        new Date(app.followUpDate) < startOfToday &&
        ['Applied', 'Assessment', 'Interview'].includes(app.status)
      ) {
        overdueFollowUps.push(app);
      }
    }

    // Sort upcoming interviews by earliest date
    upcomingInterviews.sort((a, b) => {
      const timeA = a.interviewDate ? new Date(a.interviewDate).getTime() : Infinity;
      const timeB = b.interviewDate ? new Date(b.interviewDate).getTime() : Infinity;
      return timeA - timeB;
    });

    // Active pipeline includes applied, assessment, interview
    const activePipeline = applied + assessment + interview;

    // Response rate: percentage of non-saved applications that progressed to Assessment, Interview, or Offer
    const nonSavedCount = applications.length - saved;
    const respondedCount = assessment + interview + offer;
    const responseRate =
      nonSavedCount > 0 ? Math.round((respondedCount / nonSavedCount) * 100) : 0;

    return {
      total: applications.length,
      saved,
      applied,
      assessment,
      interview,
      offer,
      rejected,
      withdrawn,
      activePipeline,
      responseRate,
      upcomingInterviews,
      overdueFollowUps,
    };
  }
}

export const jobApplicationService = new JobApplicationService();
