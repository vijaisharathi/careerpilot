export type EmploymentType = 'Full-time' | 'Internship' | 'Co-op' | 'Contract';
export type WorkMode = 'Remote' | 'Hybrid' | 'On-site';
export type JobStatus = 'active' | 'expired' | 'archived';

export interface RequiredSkillItem {
  name: string;
  minProficiency: 'Beginner' | 'Intermediate' | 'Advanced';
  importance: 'critical' | 'recommended';
  weight: number;
}

export interface MatchedSkillItem {
  name: string;
  studentProficiency: string;
  requiredProficiency: string;
  status: 'met' | 'exceeded' | 'partial';
  creditPercentage: number;
}

export interface MissingSkillItem {
  name: string;
  requiredProficiency: string;
  importance: 'critical' | 'recommended';
}

export interface EligibilityCriterion {
  criterion: string;
  required: string;
  studentValue: string;
  status: 'eligible' | 'ineligible' | 'unverified';
  note: string;
}

export interface EligibilityAssessment {
  verdict: 'Eligible' | 'Not Eligible' | 'Requires Verification';
  summary: string;
  criteria: EligibilityCriterion[];
}

export interface JobMatchResult {
  matchScore: number;
  suitability: 'High Match' | 'Moderate Match' | 'Developing Match';
  matchedSkills: MatchedSkillItem[];
  missingSkills: MissingSkillItem[];
  matchedPreferredSkills: string[];
  eligibility: EligibilityAssessment;
}

export interface BackendJobOpportunity {
  _id: string;
  title: string;
  slug: string;
  company: string;
  companyLogo: string;
  description: string;
  roleCategory: string;
  employmentType: EmploymentType;
  workMode: WorkMode;
  location: string;
  compensation: {
    amount: string;
    currency: string;
    period: 'yearly' | 'monthly' | 'hourly';
  };
  experienceRequirements: {
    minYears: number;
    level: string;
  };
  requiredSkills: RequiredSkillItem[];
  preferredSkills: string[];
  minimumQualifications: {
    minDegreeLevel?: string;
    allowedMajors?: string[];
    minGpa?: number;
    minGraduationYear?: number;
    maxGraduationYear?: number;
    additionalRequirements?: string[];
  };
  responsibilities: string[];
  applicationUrl: string;
  source: string;
  dataSourceType: 'seed_demonstration' | 'verified_api' | 'campus_partner';
  isVerifiedVacancy: boolean;
  demoDisclaimer?: string;
  publicationDate: string;
  applicationDeadline?: string | null;
  status: JobStatus;
  match?: JobMatchResult;
  isSaved?: boolean;
  savedNotes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface JobSearchQuery {
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
}

export interface JobSearchPagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface JobSearchResponse {
  opportunities: BackendJobOpportunity[];
  pagination: JobSearchPagination;
}

export interface SavedJobItem {
  _id: string;
  user: string;
  job: string;
  notes?: string;
  savedAt: string;
  jobDetails?: BackendJobOpportunity;
}

export interface JobAiInsights {
  roleSummary: string;
  gapBridgeTip: string;
  resumeOptimizationTip: string;
  isAiSimulated: boolean;
  aiProvider: string;
}

