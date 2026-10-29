export type CandidateEligibilityStatus =
  | 'eligible'
  | 'not_eligible'
  | 'needs_review'
  | 'insufficient_information';

export type RecruitmentStage =
  | 'registered'
  | 'shortlisted'
  | 'assessment'
  | 'interview'
  | 'selected'
  | 'offered'
  | 'accepted'
  | 'rejected'
  | 'withdrawn';

export type PlacementDriveStatus =
  | 'draft'
  | 'published'
  | 'registration_open'
  | 'registration_closed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface InstitutionInfo {
  id: string;
  name: string;
  code: string;
  domain?: string;
  departments?: string[];
}

export interface PlacementMetrics {
  totalStudents: number;
  completedProfiles: number;
  completedAssessments: number;
  placementReadyStudents: number;
  nearlyReadyStudents: number;
  activeDrivesCount: number;
  totalCandidatesRegistered: number;
  placementApplicationsCount: number;
  studentsWithOffersCount: number;
  pendingEligibilityReviews: number;
  candidatesInInterview: number;
}

export interface UpcomingDeadline {
  id: string;
  companyName: string;
  driveTitle: string;
  registrationDeadline: string;
  assessmentDate?: string;
  status: PlacementDriveStatus;
}

export interface PlacementDashboardData {
  institution: InstitutionInfo;
  metrics: PlacementMetrics;
  upcomingDeadlines: UpcomingDeadline[];
}

export interface PlacementStudentSummary {
  id: string;
  profileId: string;
  fullName: string;
  email: string;
  department: string;
  degree: string;
  graduationYear: number;
  completionPercentage: number;
  placementStatus: 'unplaced' | 'in_process' | 'placed';
  skillsCount: number;
  topSkills: string[];
  readinessCategory: 'Ready' | 'Nearly Ready' | 'Needs Preparation' | 'Insufficient Data';
  drivesAppliedCount: number;
  hasOffer: boolean;
}

export interface PlacementStudentDetail {
  student: {
    id: string;
    name: string;
    email: string;
    department: string;
    degree: string;
    graduationYear: number;
    headline?: string;
    completionPercentage: number;
    placementStatus: 'unplaced' | 'in_process' | 'placed';
    skills: Array<{ name: string; category: string; proficiency: string }>;
    projectsCount: number;
    certificationsCount: number;
    targetRoles: string[];
  };
  readiness: {
    overallScore: number;
    category: 'Ready' | 'Nearly Ready' | 'Needs Preparation' | 'Insufficient Data';
    breakdown: {
      profileCompletenessScore: number;
      skillsScore: number;
      careerAssessmentScore: number;
      resumeScore: number;
      interviewPracticeScore: number;
    };
    indicators: {
      profileComplete: boolean;
      hasCompletedAssessment: boolean;
      hasResume: boolean;
      hasPracticedInterviews: boolean;
      roadmapProgressPercentage: number;
    };
    passedCriteria: string[];
    missingCriteria: string[];
    recommendations: string[];
    evaluatedAt: string;
  };
  registrations: Array<{
    id: string;
    driveId: string;
    companyName: string;
    driveTitle: string;
    jobRole: string;
    currentStage: RecruitmentStage;
    eligibilityStatus: CandidateEligibilityStatus;
    appliedDate: string;
    offerDetails?: { salary?: string; designation?: string };
    stageHistory: Array<{ stage: RecruitmentStage; timestamp: string; comment?: string }>;
  }>;
}

export interface PlacementDriveItem {
  _id: string;
  id?: string;
  companyName: string;
  driveTitle: string;
  jobRole: string;
  jobDescription: string;
  requiredSkills: string[];
  eligibilityCriteria: {
    eligibleDepartments: string[];
    eligibleGraduationYears: number[];
    minGpa?: number;
    minReadinessScore?: number;
    minProfileCompletion?: number;
    requiredSkillsMustMatch?: boolean;
  };
  openingsCount?: number;
  location: string;
  employmentType: 'Full-time' | 'Internship' | 'Co-op' | 'Contract';
  workMode: 'On-site' | 'Hybrid' | 'Remote';
  compensation?: {
    amount: string;
    period: 'yearly' | 'monthly' | 'hourly';
    currency: string;
  };
  registrationStartDate: string;
  registrationDeadline: string;
  assessmentDate?: string;
  interviewDates?: string[];
  applicationUrl?: string;
  status: PlacementDriveStatus;
  candidateCounts?: {
    total: number;
    shortlisted: number;
    offered: number;
  };
  createdAt: string;
}

export interface DriveCandidateItem {
  id: string;
  driveId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  department: string;
  degree: string;
  graduationYear?: number;
  completionPercentage: number;
  eligibilityStatus: CandidateEligibilityStatus;
  eligibilityEvaluation: {
    calculatedAt: string;
    ruleVersion: string;
    passedChecks: string[];
    failedChecks: string[];
    notes: string;
    isOverridden?: boolean;
    overrideReason?: string;
    overriddenAt?: string;
  };
  currentStage: RecruitmentStage;
  stageHistory: Array<{ stage: RecruitmentStage; timestamp: string; comment?: string }>;
  offerDetails?: { salary?: string; designation?: string; recordedAt?: string };
  appliedDate: string;
}

export interface PlacementAnalyticsData {
  institution: { id: string; name: string };
  totalStudents: number;
  departmentWise: Array<{
    department: string;
    totalStudents: number;
    placedCount: number;
    placementRatePercentage: number;
    inProcessCount: number;
    unplacedCount: number;
  }>;
  graduationYearWise: Array<{
    graduationYear: number;
    totalStudents: number;
    placedCount: number;
    placementRatePercentage: number;
  }>;
  funnelStages: {
    registered: number;
    shortlisted: number;
    assessment: number;
    interview: number;
    selected: number;
    offered: number;
    accepted: number;
  };
  topIdentifiedSkills: Array<{
    skillName: string;
    studentCount: number;
    coveragePercentage: number;
  }>;
}

export interface PlacementAnnouncementItem {
  id: string;
  title: string;
  content: string;
  relatedDrive?: {
    id: string;
    title: string;
    company: string;
  } | null;
  targetDepartments: string[];
  targetGraduationYears: number[];
  publicationDate: string;
  expirationDate?: string;
}

export interface StudentCampusDriveItem extends PlacementDriveItem {
  isRegistered: boolean;
  registrationDetails?: {
    registrationId: string;
    currentStage: RecruitmentStage;
    eligibilityStatus: CandidateEligibilityStatus;
    appliedDate: string;
    offerDetails?: { salary?: string; designation?: string };
  } | null;
  eligibilityResult: {
    status: CandidateEligibilityStatus;
    passedChecks: string[];
    failedChecks: string[];
    notes: string;
  };
  isRegistrationOpen: boolean;
}

