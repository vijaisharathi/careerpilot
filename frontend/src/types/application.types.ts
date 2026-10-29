export type ApplicationStatus =
  | 'Saved'
  | 'Applied'
  | 'Assessment'
  | 'Interview'
  | 'Offer'
  | 'Rejected'
  | 'Withdrawn';

export interface IStatusHistoryEntry {
  status: ApplicationStatus;
  changedAt: string;
  notes?: string;
}

export interface IJobApplication {
  _id: string;
  user: string;
  company: string;
  jobTitle: string;
  jobOpportunity?: {
    _id: string;
    title: string;
    company: string;
    companyLogo?: string;
    location?: string;
    applicationUrl?: string;
    requirements?: string[];
  } | string | null;
  applicationUrl?: string;
  status: ApplicationStatus;
  appliedDate?: string;
  interviewDate?: string;
  deadline?: string;
  followUpDate?: string;
  notes?: string;
  location?: string;
  employmentType?: string;
  workMode?: string;
  compensation?: string;
  statusHistory: IStatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateApplicationPayload {
  company?: string;
  jobTitle?: string;
  jobOpportunity?: string;
  applicationUrl?: string;
  status?: ApplicationStatus;
  appliedDate?: string;
  interviewDate?: string | null;
  deadline?: string | null;
  followUpDate?: string | null;
  notes?: string;
  location?: string;
  employmentType?: string;
  workMode?: string;
  compensation?: string;
}

export interface UpdateApplicationPayload {
  company?: string;
  jobTitle?: string;
  applicationUrl?: string;
  status?: ApplicationStatus;
  appliedDate?: string | null;
  interviewDate?: string | null;
  deadline?: string | null;
  followUpDate?: string | null;
  notes?: string;
  location?: string;
  employmentType?: string;
  workMode?: string;
  compensation?: string;
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

export interface ApplicationQueryFilters {
  status?: ApplicationStatus | 'all';
  search?: string;
  sortBy?: 'appliedDate' | 'deadline' | 'interviewDate' | 'updatedAt' | 'company';
  sortOrder?: 'asc' | 'desc';
}

