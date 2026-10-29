export interface AdminOverviewMetrics {
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
    createdAt: string;
    status: string;
  }>;
}

export interface AdminStudentSummary {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'suspended';
  createdAt: string;
  lastLoginAt?: string;
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

export interface AdminStudentDetail {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'suspended';
  createdAt: string;
  lastLoginAt?: string;
  profile?: {
    id: string;
    fullName: string;
    college?: string;
    degree?: string;
    department?: string;
    graduationYear?: number;
    headline?: string;
    completionPercentage: number;
    skills: Array<{ name: string; level: string }>;
    projectsCount: number;
    targetRoles: string[];
  } | null;
  careerReadiness?: {
    targetRole?: string;
    readinessScore?: number;
    skillMatchScore?: number;
    analyzedAt?: string;
  } | null;
  roadmapProgress?: {
    targetRole?: string;
    totalTasks: number;
    completedTasks: number;
    overallProgress: number;
  } | null;
  placementTracker?: {
    totalApplications: number;
    activeApplications: number;
    stageBreakdown: {
      saved: number;
      applied: number;
      assessment: number;
      interview: number;
      offer: number;
      rejected: number;
    };
  };
  mockInterviewSummary?: {
    completedSessions: number;
    averageScore: number;
  };
}

export interface AdminPagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface AdminJobItem {
  _id: string;
  title: string;
  slug: string;
  company: string;
  companyLogo?: string;
  description: string;
  roleCategory: string;
  employmentType: 'Full-time' | 'Internship' | 'Co-op' | 'Contract';
  workMode: 'Remote' | 'Hybrid' | 'On-site';
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
  requiredSkills: Array<{
    name: string;
    minProficiency: string;
    importance: string;
    weight: number;
  }>;
  preferredSkills: string[];
  applicationUrl: string;
  source: string;
  dataSourceType: string;
  isVerifiedVacancy: boolean;
  publicationDate: string;
  applicationDeadline?: string | null;
  status: 'draft' | 'published' | 'active' | 'expired' | 'archived';
  createdAt: string;
}

export interface AdminCareerRoleItem {
  _id: string;
  title: string;
  slug: string;
  category: string;
  description: string;
  averageSalary: {
    entry: string;
    mid: string;
    currency: string;
  };
  marketDemand: string;
  growthOutlook: string;
  requiredSkills: Array<{
    name: string;
    category: string;
    minProficiency: string;
    importance: string;
    weight: number;
  }>;
  isStandard: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface AdminLearningResourceItem {
  _id: string;
  title: string;
  description: string;
  topic: string;
  relatedSkill: string;
  resourceUrl: string;
  resourceType: string;
  difficulty: string;
  estimatedDurationMinutes: number;
  publicationStatus: 'draft' | 'published' | 'archived';
  isFree: boolean;
  provider: string;
  isVerified: boolean;
  verificationDate?: string | null;
  createdAt: string;
}

export interface AdminAiMonitoringStats {
  provider: string;
  model: string;
  isConfigured: boolean;
  isSimulated: boolean;
  status: 'operational' | 'degraded' | 'failing';
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  successRatePercentage: number;
  averageLatencyMs: number;
  totalTokensEstimated: number;
  consecutiveFailures: number;
  recentRequests: Array<{
    timestamp: string;
    provider: string;
    model: string;
    durationMs: number;
    success: boolean;
    tokensEstimated?: number;
    errorSummary?: string;
  }>;
}

export interface AdminAuditLogItem {
  _id: string;
  eventType: string;
  actorId: string;
  actorEmail: string;
  actorName: string;
  targetId?: string;
  targetType?: string;
  action: string;
  status: 'success' | 'failure';
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface AdminPlatformSettings {
  _id: string;
  platformName: string;
  supportEmail: string;
  jobPublicationRules: {
    requireAdminApproval: boolean;
    autoArchiveExpiredDays: number;
    allowStudentSubmissions: boolean;
  };
  learningResourceVisibility: {
    requireVerificationToPublish: boolean;
    showFreeOnlyByDefault: boolean;
  };
  notificationPreferences: {
    notifyOnNewRegistrations: boolean;
    notifyOnJobApplicationSubmissions: boolean;
  };
  systemNotice?: string;
  createdAt: string;
  updatedAt: string;
}

