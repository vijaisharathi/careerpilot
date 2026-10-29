import { Types, FilterQuery } from 'mongoose';
import { JobOpportunity, IJobOpportunity, IJobOpportunityData } from '../models/jobOpportunity.model';
import { SavedJob, ISavedJob } from '../models/savedJob.model';
import { StudentProfile } from '../models/studentProfile.model';
import { jobMatchingService, IJobMatchResult } from './jobMatching.service';
import { jobSourceManager } from './jobs/jobSource.service';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

export interface SearchOpportunitiesOptions {
  q?: string;
  employmentType?: string;
  workMode?: string;
  roleCategory?: string;
  skill?: string;
  location?: string;
  minScore?: number;
  verifiedOnly?: boolean;
  sortBy?: 'relevance' | 'date' | 'deadline';
  page?: number;
  limit?: number;
  userId?: string;
}

export interface OpportunityWithMatch extends IJobOpportunityData {
  match?: IJobMatchResult;
  isSaved?: boolean;
  savedNotes?: string;
}


export interface PaginatedOpportunitiesResult {
  opportunities: OpportunityWithMatch[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export class JobDiscoveryService {
  /**
   * Searches and filters job & internship opportunities with deterministic profile matching
   */
  public async searchOpportunities(
    options: SearchOpportunitiesOptions
  ): Promise<PaginatedOpportunitiesResult> {
    // Ensure demo seed data exists if database is empty
    await jobSourceManager.seedIfEmpty();

    const {
      q,
      employmentType,
      workMode,
      roleCategory,
      skill,
      location,
      minScore,
      verifiedOnly,
      sortBy = 'relevance',
      page = 1,
      limit = 10,
      userId,
    } = options;

    const sanitizedLimit = Math.min(50, Math.max(1, Number(limit) || 10));
    const sanitizedPage = Math.max(1, Number(page) || 1);

    // Build Mongoose Query Filter
    const filter: FilterQuery<IJobOpportunity> = {
      status: { $in: ['active', 'published'] }, // Only active and published postings
    };

    if (employmentType && employmentType !== 'all') {
      filter.employmentType = employmentType;
    }

    if (workMode && workMode !== 'all') {
      filter.workMode = workMode;
    }

    if (roleCategory && roleCategory !== 'all') {
      filter.roleCategory = new RegExp(roleCategory, 'i');
    }

    if (location && location !== 'all') {
      filter.location = new RegExp(location, 'i');
    }

    if (verifiedOnly) {
      filter.isVerifiedVacancy = true;
    }

    if (skill && skill !== 'all') {
      filter.$or = [
        { 'requiredSkills.name': new RegExp(skill, 'i') },
        { preferredSkills: new RegExp(skill, 'i') },
      ];
    }

    if (q && q.trim()) {
      const escaped = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const textRegex = new RegExp(escaped, 'i');
      filter.$or = [
        { title: textRegex },
        { company: textRegex },
        { description: textRegex },
        { 'requiredSkills.name': textRegex },
      ];
    }

    // Load student profile and saved jobs if authenticated
    let studentProfile: any = null;
    let savedJobIds = new Set<string>();

    if (userId) {
      studentProfile = await StudentProfile.findOne({ user: new Types.ObjectId(userId) });
      const savedDocs = await SavedJob.find({ user: new Types.ObjectId(userId) }).select('job');
      savedJobIds = new Set(savedDocs.map((s) => s.job.toString()));
    }

    // Determine Sort Strategy
    let sortOptions: Record<string, 1 | -1> = { publicationDate: -1 };
    if (sortBy === 'deadline') {
      sortOptions = { applicationDeadline: 1 };
    } else if (sortBy === 'date') {
      sortOptions = { publicationDate: -1 };
    }

    // If sorting by relevance with an authenticated student, compute match scores in memory
    if (sortBy === 'relevance' && studentProfile) {
      // Fetch all matching records (or up to 100 for ranking)
      const allMatchingDocs = await JobOpportunity.find(filter)
        .sort({ publicationDate: -1 })
        .limit(200)
        .lean();

      // Compute matches and saved status
      let augmented: OpportunityWithMatch[] = allMatchingDocs.map((doc: any) => {
        const match = jobMatchingService.evaluateMatch(doc, studentProfile);
        return {
          ...doc,
          match,
          isSaved: savedJobIds.has(doc._id.toString()),
        };
      });

      // Filter by minScore if requested
      if (minScore && minScore > 0) {
        augmented = augmented.filter((item) => (item.match?.matchScore || 0) >= minScore);
      }

      // Sort descending by matchScore
      augmented.sort((a, b) => (b.match?.matchScore || 0) - (a.match?.matchScore || 0));

      const totalCount = augmented.length;
      const totalPages = Math.ceil(totalCount / sanitizedLimit) || 1;
      const skip = (sanitizedPage - 1) * sanitizedLimit;
      const pagedOpportunities = augmented.slice(skip, skip + sanitizedLimit);

      return {
        opportunities: pagedOpportunities,
        pagination: {
          page: sanitizedPage,
          limit: sanitizedLimit,
          totalCount,
          totalPages,
          hasNextPage: sanitizedPage < totalPages,
          hasPrevPage: sanitizedPage > 1,
        },
      };
    }

    // Database Pagination for unauthenticated or date/deadline sorted queries
    const totalCount = await JobOpportunity.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / sanitizedLimit) || 1;
    const skip = (sanitizedPage - 1) * sanitizedLimit;

    const rawDocs = await JobOpportunity.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(sanitizedLimit)
      .lean();

    const opportunities: OpportunityWithMatch[] = rawDocs.map((doc: any) => {
      const match = studentProfile
        ? jobMatchingService.evaluateMatch(doc, studentProfile)
        : undefined;

      return {
        ...doc,
        match,
        isSaved: savedJobIds.has(doc._id.toString()),
      };
    });

    return {
      opportunities,
      pagination: {
        page: sanitizedPage,
        limit: sanitizedLimit,
        totalCount,
        totalPages,
        hasNextPage: sanitizedPage < totalPages,
        hasPrevPage: sanitizedPage > 1,
      },
    };
  }

  /**
   * Retrieves single opportunity by MongoDB ObjectId or URL-friendly slug
   */
  public async getOpportunityByIdOrSlug(
    idOrSlug: string,
    userId?: string
  ): Promise<OpportunityWithMatch> {
    const isObjectId = Types.ObjectId.isValid(idOrSlug);
    const query = isObjectId ? { _id: new Types.ObjectId(idOrSlug) } : { slug: idOrSlug };

    const doc = await JobOpportunity.findOne(query).lean();
    if (!doc) {
      throw new AppError(`Opportunity '${idOrSlug}' was not found.`, 404);
    }

    let match: IJobMatchResult | undefined;
    let isSaved = false;
    let savedNotes: string | undefined;

    if (userId) {
      const profile = await StudentProfile.findOne({ user: new Types.ObjectId(userId) });
      if (profile) {
        match = jobMatchingService.evaluateMatch(doc as any, profile);
      }

      const savedDoc = await SavedJob.findOne({
        user: new Types.ObjectId(userId),
        job: doc._id,
      });

      if (savedDoc) {
        isSaved = true;
        savedNotes = savedDoc.notes;
      }
    }

    return {
      ...doc,
      match,
      isSaved,
      savedNotes,
    } as unknown as OpportunityWithMatch;
  }

  /**
   * Lists all bookmarked/saved opportunities for an authenticated student
   */
  public async getSavedJobs(userId: string): Promise<Array<ISavedJob & { jobDetails?: OpportunityWithMatch }>> {
    const saved = await SavedJob.find({ user: new Types.ObjectId(userId) })
      .populate('job')
      .sort({ savedAt: -1 })
      .lean();

    const profile = await StudentProfile.findOne({ user: new Types.ObjectId(userId) });

    return saved.map((item: any) => {
      if (item.job && profile) {
        const match = jobMatchingService.evaluateMatch(item.job, profile);
        item.jobDetails = {
          ...item.job,
          match,
          isSaved: true,
          savedNotes: item.notes,
        };
      }
      return item;
    });
  }

  /**
   * Saves/bookmarks an opportunity with optional personal notes
   */
  public async saveJob(userId: string, jobId: string, notes?: string): Promise<ISavedJob> {
    if (!Types.ObjectId.isValid(jobId)) {
      throw new AppError('Invalid opportunity ID format', 400);
    }

    const job = await JobOpportunity.findById(jobId);
    if (!job) {
      throw new AppError('Opportunity not found', 404);
    }

    // Check if already saved
    const existing = await SavedJob.findOne({
      user: new Types.ObjectId(userId),
      job: new Types.ObjectId(jobId),
    });

    if (existing) {
      if (notes !== undefined) {
        existing.notes = notes;
        await existing.save();
      }
      return existing;
    }

    const newSave = new SavedJob({
      user: new Types.ObjectId(userId),
      job: new Types.ObjectId(jobId),
      notes: notes || '',
    });

    await newSave.save();
    logger.info(`[JobDiscoveryService] User ${userId} saved job ${jobId}`);
    return newSave;
  }

  /**
   * Removes an opportunity from the student's saved list
   */
  public async unsaveJob(userId: string, jobId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(jobId)) {
      throw new AppError('Invalid opportunity ID format', 400);
    }

    const result = await SavedJob.findOneAndDelete({
      user: new Types.ObjectId(userId),
      job: new Types.ObjectId(jobId),
    });

    if (!result) {
      throw new AppError('Opportunity was not saved in your profile', 404);
    }

    logger.info(`[JobDiscoveryService] User ${userId} removed job ${jobId} from saved list`);
    return true;
  }
}

export const jobDiscoveryService = new JobDiscoveryService();
