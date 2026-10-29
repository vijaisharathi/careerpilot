export interface CareerSkillRequirement {
  name: string;
  category: 'languages' | 'frameworks' | 'databases' | 'cloud' | 'soft_skills';
  minProficiency: 'Beginner' | 'Intermediate' | 'Advanced';
  importance: 'critical' | 'recommended';
  weight: number;
}

export interface CareerRole {
  _id?: string;
  title: string;
  slug: string;
  category: string;
  description: string;
  averageSalary: {
    entry: string;
    mid: string;
    currency: string;
  };
  marketDemand: 'Extremely High' | 'High' | 'Moderate';
  growthOutlook: string;
  requiredSkills: CareerSkillRequirement[];
  eligibilityCriteria?: {
    minDegreeLevel: string;
    relevantFields: string[];
  };
  recommendedCertifications: Array<{
    title: string;
    issuer: string;
    importance: 'high' | 'medium';
  }>;
  recommendedProjects: Array<{
    title: string;
    description: string;
    technologies: string[];
  }>;
}

export interface MatchedSkill {
  name: string;
  category: string;
  studentLevel: string;
  requiredLevel: string;
  status: 'met' | 'exceeded' | 'partial';
  creditPercentage: number;
}

export interface MissingSkill {
  name: string;
  category: string;
  requiredLevel: string;
  importance: 'critical' | 'recommended';
  estimatedHours: number;
  whyNeeded?: string;
}

export interface TailoredProject {
  title: string;
  description: string;
  skillsCovered: string[];
  impact?: string;
}

export interface TailoredCertification {
  title: string;
  issuer: string;
  priority: 'High' | 'Medium' | 'Low';
  reason?: string;
}

export interface ActionPlanStep {
  timeframe: string;
  objective: string;
  tasks: string[];
}

export interface CareerAnalysisScores {
  readinessScore: number;
  skillMatchScore: number;
  projectScore: number;
  experienceScore: number;
  academicScore: number;
  suitabilityLevel: 'High Match' | 'Moderate Match' | 'Developing Match';
}

export interface CareerAnalysisExplanation {
  executiveSummary: string;
  strengthsNarrative: string;
  gapAnalysisNarrative: string;
  tailoredProjects: TailoredProject[];
  tailoredCertifications: TailoredCertification[];
  actionPlan: ActionPlanStep[];
  aiProvider: string;
  isAiSimulated: boolean;
}

export interface CareerAnalysis {
  _id: string;
  user: string;
  profileId: string;
  targetRole: {
    roleId?: string;
    title: string;
    slug: string;
    category: string;
  };
  profileSnapshot: {
    skillsCount: number;
    projectsCount: number;
    experienceCount: number;
    lastProfileUpdate: string;
  };
  scores: CareerAnalysisScores;
  matchedSkills: MatchedSkill[];
  missingSkills: MissingSkill[];
  strengths: string[];
  improvementAreas: string[];
  aiExplanation: CareerAnalysisExplanation;
  isStale: boolean;
  createdAt: string;
  updatedAt: string;
}

