export interface UserProfile {
  university?: string;
  degree?: string;
  department?: string;
  graduationYear?: number;
  skills: string[];
  targetRoles: string[];
  bio?: string;
}

export interface SkillEntry {
  _id?: string;
  name: string;
  category: 'languages' | 'frameworks' | 'databases' | 'cloud' | 'soft_skills';
  proficiency: 'Beginner' | 'Intermediate' | 'Advanced';
  verified?: boolean;
}

export interface ProjectEntry {
  _id?: string;
  title: string;
  technologies: string[];
  link?: string;
  bullets: string[];
}

export interface CertificationEntry {
  _id?: string;
  title: string;
  issuer: string;
  issueDate: string;
  credentialUrl?: string;
}

export interface EducationEntry {
  _id?: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa?: string;
}

export interface ExperienceEntry {
  _id?: string;
  role: string;
  company: string;
  location?: string;
  startDate: string;
  endDate: string;
  current?: boolean;
  bullets: string[];
}

export interface CareerInterests {
  targetRoles: string[];
  preferredLocations: string[];
  preferredMode: 'Remote' | 'Hybrid' | 'On-site' | 'Any';
  careerGoals?: string;
  targetCompensation?: string;
}

export interface BackendStudentProfile {
  _id: string;
  user: string;
  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  headline?: string;
  college: string;
  degree: string;
  department: string;
  graduationYear?: number;
  educationHistory: EducationEntry[];
  skills: SkillEntry[];
  projects: ProjectEntry[];
  certifications: CertificationEntry[];
  experience: ExperienceEntry[];
  careerInterests: CareerInterests;
  completionPercentage: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'mentor' | 'placement_officer' | 'admin';
  institutionId?: string;
  assignedDepartment?: string;
  profileId?: string;
  profile?: UserProfile;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface AuthResponseData {
  user: User;
  profile: BackendStudentProfile;
  tokens: AuthTokens;
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  role?: 'student' | 'mentor' | 'placement_officer' | 'admin';
  profile?: {
    college?: string;
    university?: string;
    degree?: string;
    department?: string;
    graduationYear?: number;
    skills?: string[];
    targetRoles?: string[];
    bio?: string;
  };
}
