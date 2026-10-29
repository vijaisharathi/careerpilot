export type RoadmapTaskType =
  | 'Concept'
  | 'Hands-on Exercise'
  | 'Project'
  | 'DSA'
  | 'Reading'
  | 'Assessment';

export interface VerifiedResource {
  title: string;
  type: string;
  url: string;
  isFree: boolean;
  provider: string;
}

export interface BackendRoadmapTask {
  _id: string;
  taskKey: string;
  title: string;
  type: RoadmapTaskType;
  learningObjective: string;
  estimatedMinutes: number;
  completed: boolean;
  completedAt?: string | null;
  resources: VerifiedResource[];
}

export interface BackendRoadmapWeek {
  weekNumber: number;
  theme: string;
  tasks: BackendRoadmapTask[];
}

export interface BackendRoadmapPhase {
  phaseNumber: number;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'upcoming';
  progress: number; // 0-100%
  weeks: BackendRoadmapWeek[];
}

export interface BackendLearningRoadmap {
  _id: string;
  user: string;
  profileId: string;
  analysisId?: string;
  targetRole: {
    slug: string;
    title: string;
    category: string;
  };
  weeklyHours: number;
  totalWeeks: number;
  totalTasks: number;
  completedTasks: number;
  overallProgress: number; // 0-100%
  status: 'in-progress' | 'completed' | 'archived';
  phases: BackendRoadmapPhase[];
  version: number;
  isAiPersonalized: boolean;
  aiProvider: string;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateRoadmapPayload {
  targetRoleSlug?: string;
  weeklyHours?: number;
  totalWeeks?: number;
}

export interface UpdateSchedulePayload {
  weeklyHours: number;
  totalWeeks?: number;
}

export interface RegenerateRoadmapPayload {
  targetRoleSlug?: string;
  weeklyHours?: number;
  totalWeeks?: number;
  preserveProgress?: boolean;
}

