export interface DashboardSkillGap {
  name: string;
  category: string;
  requiredLevel: string;
  importance: 'critical' | 'recommended';
  estimatedHours: number;
}

export interface DashboardUpcomingTask {
  _id: string;
  title: string;
  learningObjective: string;
  estimatedMinutes: number;
  type: string;
}

export interface DashboardSavedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  employmentType: string;
}

export interface DashboardUpcomingInterview {
  id: string;
  company: string;
  jobTitle: string;
  interviewDate: string;
  location: string;
  notes?: string;
}

export interface DashboardFollowUpItem {
  id: string;
  company: string;
  jobTitle: string;
  followUpDate: string;
  status: string;
}

export interface DashboardInterviewPractice {
  id: string;
  targetRole: string;
  interviewType: string;
  difficulty: string;
  score: number;
  completedAt: string;
  answeredCount: number;
  totalQuestions: number;
}

export interface DashboardRecommendedAction {
  id: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionLabel: string;
  actionUrl: string;
}

export interface DashboardMetricSummary {
  profile: {
    name: string;
    college: string;
    degree: string;
    graduationYear: number;
    completionPercentage: number;
    targetRoles: string[];
    skillsCount: number;
  };
  careerAnalysis: {
    hasAnalysis: boolean;
    targetRole?: string;
    readinessScore?: number;
    suitabilityLevel?: string;
    topStrengths?: string[];
    criticalGapsCount?: number;
    recommendedGapsCount?: number;
    analyzedAt?: string;
  };
  skillGaps: DashboardSkillGap[];
  roadmap: {
    hasRoadmap: boolean;
    targetRole?: string;
    totalTasks?: number;
    completedTasks?: number;
    overallProgress?: number;
    weeklyHours?: number;
    totalWeeks?: number;
    upcomingTasks?: DashboardUpcomingTask[];
  };
  jobs: {
    totalSaved: number;
    savedJobs: DashboardSavedJob[];
  };
  applications: {
    totalApplications: number;
    activePipelineCount: number;
    responseRatePercentage: number;
    stageCounts: {
      saved: number;
      applied: number;
      assessment: number;
      interview: number;
      offer: number;
      rejected: number;
      withdrawn: number;
    };
  };
  upcomingInterviews: DashboardUpcomingInterview[];
  pendingFollowUps: {
    overdueCount: number;
    overdue: DashboardFollowUpItem[];
    upcomingCount: number;
    upcoming: DashboardFollowUpItem[];
  };
  recentInterviewPractice: DashboardInterviewPractice[];
  resumeAnalysis: {
    hasAnalysis: boolean;
    targetJobTitle?: string;
    overallScore?: number;
    missingKeywordsCount?: number;
    matchedKeywordsCount?: number;
    analyzedAt?: string;
  };
  recommendedNextActions: DashboardRecommendedAction[];
}

