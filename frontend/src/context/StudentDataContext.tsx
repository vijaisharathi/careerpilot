import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { profileService } from '../services/profile.service';
import { authService } from '../services/auth.service';
import { careerService } from '../services/career.service';
import { roadmapService } from '../services/roadmap.service';
import { jobService } from '../services/job.service';
import { applicationService } from '../services/application.service';
import { BackendStudentProfile } from '../types/user.types';
import { CareerAnalysis, CareerRole } from '../types/career.types';
import {
  BackendLearningRoadmap,
  GenerateRoadmapPayload,
  UpdateSchedulePayload,
  RegenerateRoadmapPayload,
} from '../types/roadmap.types';
import {
  IJobApplication,
  ApplicationStatsSummary,
  CreateApplicationPayload,
  UpdateApplicationPayload,
  ApplicationStatus,
} from '../types/application.types';


export interface StudentSkill {
  id: string;
  name: string;
  category: 'languages' | 'frameworks' | 'databases' | 'cloud' | 'soft_skills';
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  verified: boolean;
}

export interface StudentEducation {
  institution: string;
  degree: string;
  major: string;
  graduationYear: number;
  currentYear: string;
  gpa: string;
}

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  location: string;
  headline: string;
  bio: string;
  education: StudentEducation;
  targetRoles: string[];
  skills: StudentSkill[];
  certifications: Array<{
    id: string;
    title: string;
    issuer: string;
    issueDate: string;
    credentialUrl?: string;
  }>;
  socials: {
    github: string;
    linkedin: string;
    leetcode: string;
    portfolio?: string;
  };
}

export interface JobOpportunity {
  id: string;
  title: string;
  company: string;
  companyLogo: string;
  location: string;
  type: 'Full-time' | 'Internship' | 'Co-op';
  mode: 'Remote' | 'Hybrid' | 'On-site';
  compensation: string;
  matchScore: number;
  deadline: string;
  postedDate: string;
  description: string;
  requirements: string[];
  requiredSkills: string[];
  matchingSkills: string[];
  missingSkills: string[];
  experienceLevel: 'Entry-Level' | 'Internship' | 'Junior';
  isSaved?: boolean;
}

export type ApplicationStage = 'wishlist' | 'applied' | 'interviewing' | 'offered' | 'rejected';

export interface JobApplication {
  id: string;
  jobId?: string;
  company: string;
  role: string;
  location: string;
  type: 'Full-time' | 'Internship';
  appliedDate: string;
  stage: ApplicationStage;
  nextStep?: string;
  interviewDate?: string;
  compensation?: string;
  notes?: string;
}

export interface RoadmapMilestone {
  id: string;
  title: string;
  targetRole: string;
  estimatedWeeks: number;
  status: 'completed' | 'in-progress' | 'upcoming';
  description: string;
  modules: Array<{
    id: string;
    title: string;
    type: 'Course' | 'Project' | 'DSA' | 'Article';
    estimatedHours: number;
    completed: boolean;
    resourceName: string;
    resourceUrl?: string;
  }>;
}

export interface NotificationItem {
  id: string;
  type: 'interview' | 'application' | 'roadmap' | 'job_match' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export interface ResumeData {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    github: string;
    summary: string;
  };
  education: Array<{
    id: string;
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
    gpa: string;
  }>;
  experience: Array<{
    id: string;
    role: string;
    company: string;
    location: string;
    startDate: string;
    endDate: string;
    current: boolean;
    bullets: string[];
  }>;
  projects: Array<{
    id: string;
    title: string;
    technologies: string[];
    link?: string;
    bullets: string[];
  }>;
  skills: {
    languages: string[];
    frameworks: string[];
    tools: string[];
    concepts: string[];
  };
}

interface StudentDataContextType {
  profile: StudentProfile;
  backendProfile: BackendStudentProfile | null;
  isProfileSyncing: boolean;
  syncProfileWithBackend: () => Promise<void>;
  updateProfile: (updated: Partial<StudentProfile>) => Promise<void> | void;
  addSkill: (skill: Omit<StudentSkill, 'id' | 'verified'>) => Promise<void> | void;
  removeSkill: (skillId: string) => Promise<void> | void;
  addCertification: (cert: Omit<StudentProfile['certifications'][0], 'id'>) => Promise<void> | void;
  removeCertification: (certId: string) => Promise<void> | void;
  latestAnalysis: CareerAnalysis | null;
  analysisHistory: CareerAnalysis[];
  rolesCatalog: CareerRole[];
  isAnalyzing: boolean;
  runCareerAnalysis: (roleSlug?: string) => Promise<CareerAnalysis>;
  fetchAnalysisHistory: () => Promise<void>;
  jobs: JobOpportunity[];
  savedJobs: JobOpportunity[];
  toggleSaveJob: (jobId: string) => void;
  applications: JobApplication[];
  backendApplications: IJobApplication[];
  applicationStats: ApplicationStatsSummary | null;
  fetchApplications: () => Promise<IJobApplication[]>;
  fetchApplicationStats: () => Promise<ApplicationStatsSummary | null>;
  createApplication: (payload: CreateApplicationPayload) => Promise<IJobApplication>;
  updateApplication: (id: string, payload: UpdateApplicationPayload) => Promise<IJobApplication>;
  deleteApplication: (id: string) => Promise<void>;
  addApplication: (app: Omit<JobApplication, 'id'>) => Promise<void> | void;
  updateApplicationStage: (id: string, stage: ApplicationStage) => Promise<void> | void;
  roadmaps: RoadmapMilestone[];
  toggleRoadmapItem: (milestoneId: string, moduleId: string) => void;
  activeRoadmap: BackendLearningRoadmap | null;
  isRoadmapLoading: boolean;
  fetchActiveRoadmap: () => Promise<BackendLearningRoadmap | null>;
  generatePersonalizedRoadmap: (payload?: GenerateRoadmapPayload) => Promise<BackendLearningRoadmap>;
  toggleRoadmapTaskStatus: (taskId: string, completed: boolean) => Promise<BackendLearningRoadmap>;
  updateRoadmapSchedule: (payload: UpdateSchedulePayload) => Promise<BackendLearningRoadmap>;
  regeneratePersonalizedRoadmap: (payload?: RegenerateRoadmapPayload) => Promise<BackendLearningRoadmap>;
  notifications: NotificationItem[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  resume: ResumeData;
  updateResume: (updated: Partial<ResumeData>) => void;
}

const defaultProfile: StudentProfile = {
  id: 'std_01',
  name: 'Alex Chen',
  email: 'alex.chen@university.edu',
  phone: '+1 (555) 234-5678',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
  location: 'San Jose, CA',
  headline: 'Computer Science Undergrad | Aspiring Full-Stack & Systems Engineer',
  bio: 'Junior CS student passionate about building scalable web applications, distributed backend architectures, and developer tooling. Actively preparing for 2026/2027 software engineering campus placement drives.',
  education: {
    institution: 'California State University, Silicon Valley',
    degree: 'Bachelor of Science (B.S.)',
    major: 'Computer Science (Honors Program)',
    graduationYear: 2027,
    currentYear: '3rd Year (Junior)',
    gpa: '3.84 / 4.0',
  },
  targetRoles: ['Full-Stack Software Engineer', 'Backend Systems Engineer', 'Cloud / DevOps Engineer'],
  skills: [
    { id: 'sk_1', name: 'TypeScript', category: 'languages', level: 'Advanced', verified: true },
    { id: 'sk_2', name: 'JavaScript (ES6+)', category: 'languages', level: 'Advanced', verified: true },
    { id: 'sk_3', name: 'Python', category: 'languages', level: 'Intermediate', verified: true },
    { id: 'sk_4', name: 'C++', category: 'languages', level: 'Intermediate', verified: false },
    { id: 'sk_5', name: 'React.js', category: 'frameworks', level: 'Advanced', verified: true },
    { id: 'sk_6', name: 'Node.js & Express', category: 'frameworks', level: 'Advanced', verified: true },
    { id: 'sk_7', name: 'Tailwind CSS', category: 'frameworks', level: 'Advanced', verified: true },
    { id: 'sk_8', name: 'MongoDB & Mongoose', category: 'databases', level: 'Intermediate', verified: true },
    { id: 'sk_9', name: 'PostgreSQL', category: 'databases', level: 'Intermediate', verified: false },
    { id: 'sk_10', name: 'Docker', category: 'cloud', level: 'Beginner', verified: false },
    { id: 'sk_11', name: 'Git & GitHub', category: 'cloud', level: 'Advanced', verified: true },
    { id: 'sk_12', name: 'RESTful API Design', category: 'frameworks', level: 'Advanced', verified: true },
    { id: 'sk_13', name: 'Agile & Scrum', category: 'soft_skills', level: 'Intermediate', verified: false },
    { id: 'sk_14', name: 'Technical Problem Solving', category: 'soft_skills', level: 'Advanced', verified: true },
  ],
  certifications: [
    {
      id: 'cert_1',
      title: 'AWS Certified Cloud Practitioner',
      issuer: 'Amazon Web Services',
      issueDate: 'August 2025',
      credentialUrl: 'https://aws.amazon.com/verification',
    },
    {
      id: 'cert_2',
      title: 'Meta Front-End Developer Professional Certificate',
      issuer: 'Coursera / Meta',
      issueDate: 'March 2025',
    },
  ],
  socials: {
    github: 'https://github.com/alexchen-dev',
    linkedin: 'https://linkedin.com/in/alexchen-cs',
    leetcode: 'https://leetcode.com/alexchen_algo',
    portfolio: 'https://alexchen.dev',
  },
};

const defaultJobs: JobOpportunity[] = [
  {
    id: 'job_01',
    title: 'Software Engineering Intern — Summer 2026',
    company: 'Stripe',
    companyLogo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80',
    location: 'San Francisco, CA (or Remote)',
    type: 'Internship',
    mode: 'Hybrid',
    compensation: '$58 / hr + Housing Stipend',
    matchScore: 94,
    deadline: 'In 12 days',
    postedDate: '3 days ago',
    description:
      'Join Stripe’s Core Infrastructure or Developer Products engineering teams to build resilient payments rails and APIs that power global commerce.',
    requirements: [
      'Currently enrolled in a BS/MS program in Computer Science or related STEM field graduating late 2026 or 2027.',
      'Strong proficiency in TypeScript, JavaScript, Python, or Go.',
      'Foundational understanding of distributed systems, HTTP protocols, and database modeling.',
      'Passionate about API ergonomics and clean architectural abstractions.',
    ],
    requiredSkills: ['TypeScript', 'Node.js', 'React.js', 'PostgreSQL', 'Docker', 'Distributed Systems'],
    matchingSkills: ['TypeScript', 'Node.js', 'React.js', 'PostgreSQL'],
    missingSkills: ['Distributed Systems', 'Docker'],
    experienceLevel: 'Internship',
    isSaved: true,
  },
  {
    id: 'job_02',
    title: 'Associate Full-Stack Software Developer (Campus New Grad)',
    company: 'Datadog',
    companyLogo: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=120&q=80',
    location: 'New York, NY',
    type: 'Full-time',
    mode: 'On-site',
    compensation: '$135,000 - $155,000 / yr + Equity',
    matchScore: 89,
    deadline: 'In 24 days',
    postedDate: '5 days ago',
    description:
      'Datadog is looking for upcoming software engineering graduates to build real-time observability dashboards, streaming telemetry pipelines, and collaborative web applications.',
    requirements: [
      'Graduation between December 2026 and June 2027.',
      'Experience building full-stack applications with modern front-ends and performant backends.',
      'Understanding of concurrency, relational databases, and microservices.',
    ],
    requiredSkills: ['React.js', 'TypeScript', 'Python', 'Go', 'Docker', 'CI/CD'],
    matchingSkills: ['React.js', 'TypeScript', 'Python'],
    missingSkills: ['Go', 'Docker', 'CI/CD'],
    experienceLevel: 'Entry-Level',
    isSaved: false,
  },
  {
    id: 'job_03',
    title: 'Cloud Systems & Backend Engineering Intern',
    company: 'MongoDB',
    companyLogo: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=120&q=80',
    location: 'Austin, TX (Remote option available)',
    type: 'Internship',
    mode: 'Remote',
    compensation: '$52 / hr + Relocation Bonus',
    matchScore: 92,
    deadline: 'In 18 days',
    postedDate: '1 week ago',
    description:
      'Work alongside the MongoDB Atlas Cloud team building scalable database-as-a-service orchestration tooling and modern developer control planes.',
    requirements: [
      'Strong grasp of data structures, algorithms, and complexity analysis.',
      'Proficiency in Node.js, TypeScript, C++, or Java.',
      'Hands-on experience with MongoDB, schema design, and document indexing.',
    ],
    requiredSkills: ['Node.js', 'MongoDB & Mongoose', 'TypeScript', 'AWS/GCP', 'System Design'],
    matchingSkills: ['Node.js', 'MongoDB & Mongoose', 'TypeScript'],
    missingSkills: ['AWS/GCP', 'System Design'],
    experienceLevel: 'Internship',
    isSaved: true,
  },
  {
    id: 'job_04',
    title: 'Frontend Platform & Design Systems Intern',
    company: 'Figma',
    companyLogo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80',
    location: 'San Francisco, CA',
    type: 'Internship',
    mode: 'Hybrid',
    compensation: '$60 / hr + Benefits',
    matchScore: 86,
    deadline: 'In 8 days',
    postedDate: '2 days ago',
    description:
      'Help shape the future of design and code collaboration by contributing to Figma’s core web canvas, component libraries, and frontend runtime performance.',
    requirements: [
      'Deep knowledge of JavaScript/TypeScript, the DOM, CSS fundamentals, and web standards.',
      'Passion for responsive design, component accessibility (WCAG), and developer experience.',
    ],
    requiredSkills: ['TypeScript', 'React.js', 'Tailwind CSS', 'Web Performance', 'Canvas / WebGL'],
    matchingSkills: ['TypeScript', 'React.js', 'Tailwind CSS'],
    missingSkills: ['Web Performance', 'Canvas / WebGL'],
    experienceLevel: 'Internship',
    isSaved: false,
  },
  {
    id: 'job_05',
    title: 'Junior Backend & AI Integration Engineer',
    company: 'Anthropic',
    companyLogo: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=120&q=80',
    location: 'San Francisco, CA',
    type: 'Full-time',
    mode: 'On-site',
    compensation: '$150,000 - $175,000 / yr + Equity',
    matchScore: 81,
    deadline: 'In 30 days',
    postedDate: '1 week ago',
    description:
      'Build dependable API infrastructure, rate limiters, evaluation harnesses, and secure agent orchestration services for frontier AI models.',
    requirements: [
      'Degree in Computer Science, Software Engineering, or related discipline.',
      'Demonstrated experience with async Python/TypeScript backends and relational/NoSQL datastores.',
      'Comfortable reviewing code, writing unit and integration tests, and maintaining high reliability.',
    ],
    requiredSkills: ['Python', 'TypeScript', 'Node.js', 'Docker', 'Redis', 'LLM Integration'],
    matchingSkills: ['Python', 'TypeScript', 'Node.js'],
    missingSkills: ['Docker', 'Redis', 'LLM Integration'],
    experienceLevel: 'Entry-Level',
    isSaved: false,
  },
];

const defaultApplications: JobApplication[] = [
  {
    id: 'app_01',
    jobId: 'job_01',
    company: 'Stripe',
    role: 'Software Engineering Intern',
    location: 'San Francisco, CA',
    type: 'Internship',
    appliedDate: '2026-10-18',
    stage: 'interviewing',
    nextStep: 'Technical Screen & System Architecture (45 mins)',
    interviewDate: '2026-11-04 14:00 PST',
    compensation: '$58 / hr',
    notes: 'Reviewed Stripe API conventions and rate-limiting patterns. Focus on concurrency & idempotent requests.',
  },
  {
    id: 'app_02',
    jobId: 'job_03',
    company: 'MongoDB',
    role: 'Cloud Systems Intern',
    location: 'Austin, TX',
    type: 'Internship',
    appliedDate: '2026-10-22',
    stage: 'applied',
    nextStep: 'Online Assessment (HackerRank - 70 mins)',
    compensation: '$52 / hr',
    notes: 'HackerRank link received. Must complete before Nov 6.',
  },
  {
    id: 'app_03',
    company: 'Microsoft',
    role: 'SWE Intern — Azure Developer Tools',
    location: 'Redmond, WA',
    type: 'Internship',
    appliedDate: '2026-10-05',
    stage: 'interviewing',
    nextStep: 'Final Round Virtual Onsite (3 rounds)',
    interviewDate: '2026-11-08 10:00 PST',
    compensation: '$54 / hr + Housing',
    notes: 'Completed behavioral round with recruiter. Prep tree traversals and dynamic programming.',
  },
  {
    id: 'app_04',
    jobId: 'job_02',
    company: 'Datadog',
    role: 'Associate Full-Stack Software Developer',
    location: 'New York, NY',
    type: 'Full-time',
    appliedDate: '2026-10-26',
    stage: 'wishlist',
    nextStep: 'Tailor resume for observability keywords before submitting',
    compensation: '$140k/yr',
    notes: 'Target application deadline is Nov 20.',
  },
  {
    id: 'app_05',
    company: 'Meta',
    role: 'Software Engineer Intern (Enterprise Products)',
    location: 'Menlo Park, CA',
    type: 'Internship',
    appliedDate: '2026-09-20',
    stage: 'offered',
    nextStep: 'Offer Review & Decision Deadline: Dec 15',
    compensation: '$57 / hr + $10k Housing Stipend',
    notes: 'Received official offer letter! Team match will happen in spring 2027.',
  },
  {
    id: 'app_06',
    company: 'Palantir',
    role: 'Forward Deployed Software Engineer Intern',
    location: 'Palo Alto, CA',
    type: 'Internship',
    appliedDate: '2026-09-15',
    stage: 'rejected',
    nextStep: 'Re-apply for fall cycle in 6 months',
    notes: 'Rejected after Round 2 decomposition problem. Need to improve algorithmic communication.',
  },
];

const defaultRoadmaps: RoadmapMilestone[] = [
  {
    id: 'ms_1',
    title: 'Milestone 1: Core DSA & Problem-Solving Mastery',
    targetRole: 'Full-Stack Software Engineer',
    estimatedWeeks: 4,
    status: 'completed',
    description: 'Build algorithmic intuition across high-frequency placement interview topics.',
    modules: [
      {
        id: 'mod_1',
        title: 'Arrays, Two Pointers & Sliding Window Patterns',
        type: 'DSA',
        estimatedHours: 8,
        completed: true,
        resourceName: 'LeetCode Curated 75',
      },
      {
        id: 'mod_2',
        title: 'Binary Search & Monotonic Stacks',
        type: 'DSA',
        estimatedHours: 6,
        completed: true,
        resourceName: 'NeetCode Algorithm Roadmap',
      },
      {
        id: 'mod_3',
        title: 'Trees, BST Validation & Graph BFS/DFS',
        type: 'DSA',
        estimatedHours: 12,
        completed: true,
        resourceName: 'MIT 6.006 Lecture Notes',
      },
      {
        id: 'mod_4',
        title: 'Dynamic Programming Fundamentals (1D & 2D Memoization)',
        type: 'DSA',
        estimatedHours: 14,
        completed: true,
        resourceName: 'Grokking the Coding Interview',
      },
    ],
  },
  {
    id: 'ms_2',
    title: 'Milestone 2: Production Full-Stack Architecture',
    targetRole: 'Full-Stack Software Engineer',
    estimatedWeeks: 4,
    status: 'in-progress',
    description: 'Ship clean, typed full-stack services with secure JWT authentication and validation.',
    modules: [
      {
        id: 'mod_5',
        title: 'Advanced TypeScript: Generics, Envelopes & Strict Type Safety',
        type: 'Course',
        estimatedHours: 8,
        completed: true,
        resourceName: 'Total TypeScript Core Workshops',
      },
      {
        id: 'mod_6',
        title: 'RESTful API Engineering with Express, Zod & Mongoose',
        type: 'Course',
        estimatedHours: 10,
        completed: true,
        resourceName: 'Production Node.js Architecture Series',
      },
      {
        id: 'mod_7',
        title: 'Docker Containerization & Multi-stage Builds for Local Dev',
        type: 'Project',
        estimatedHours: 8,
        completed: false,
        resourceName: 'Docker Official Documentation & Guides',
      },
      {
        id: 'mod_8',
        title: 'Database Query Optimization, Indexing & Connection Pooling',
        type: 'Article',
        estimatedHours: 6,
        completed: false,
        resourceName: 'MongoDB Atlas Performance Best Practices',
      },
    ],
  },
  {
    id: 'ms_3',
    title: 'Milestone 3: Scalability, Caching & System Design',
    targetRole: 'Full-Stack Software Engineer',
    estimatedWeeks: 3,
    status: 'upcoming',
    description: 'Learn modern distributed architectural components asked in Tier-1 technical rounds.',
    modules: [
      {
        id: 'mod_9',
        title: 'Distributed Caching Strategies with Redis (TTL, Invalidation)',
        type: 'Course',
        estimatedHours: 8,
        completed: false,
        resourceName: 'Redis University RU101',
      },
      {
        id: 'mod_10',
        title: 'Asynchronous Job Queues with RabbitMQ / Redis BullMQ',
        type: 'Project',
        estimatedHours: 10,
        completed: false,
        resourceName: 'System Design Interview — Alex Xu',
      },
      {
        id: 'mod_11',
        title: 'API Rate Limiting, Load Balancing & Reverse Proxies',
        type: 'Article',
        estimatedHours: 6,
        completed: false,
        resourceName: 'High Scalability Architectural Case Studies',
      },
    ],
  },
  {
    id: 'ms_4',
    title: 'Milestone 4: Interview Simulation & Behavioral STAR Mastery',
    targetRole: 'Full-Stack Software Engineer',
    estimatedWeeks: 2,
    status: 'upcoming',
    description: 'Master live coding walkthroughs, trade-off communication, and behavioral storytelling.',
    modules: [
      {
        id: 'mod_12',
        title: 'Complete 5 AI-Powered Technical Mock Sessions',
        type: 'DSA',
        estimatedHours: 10,
        completed: false,
        resourceName: 'Career Pilot AI Mock Interview Simulator',
      },
      {
        id: 'mod_13',
        title: 'Prepare 6 Structured STAR Behavioral Stories (Leadership, Conflict, Failure)',
        type: 'Course',
        estimatedHours: 6,
        completed: false,
        resourceName: 'Cracking the Coding Interview — Behavioral Matrix',
      },
    ],
  },
];

const defaultNotifications: NotificationItem[] = [
  {
    id: 'notif_1',
    type: 'interview',
    title: 'Interview Reminder: Stripe Technical Screen',
    message: 'Your 45-minute technical screen with Stripe is scheduled for Wednesday, Nov 4 at 2:00 PM PST.',
    timestamp: '2 hours ago',
    read: false,
    actionUrl: '/interview-prep',
  },
  {
    id: 'notif_2',
    type: 'job_match',
    title: '94% Match Job Alert: Stripe Summer Intern',
    message: 'A new opportunity closely aligns with your TypeScript, React, and REST API skills.',
    timestamp: '1 day ago',
    read: false,
    actionUrl: '/jobs/job_01',
  },
  {
    id: 'notif_3',
    type: 'roadmap',
    title: 'Roadmap Milestone In-Progress',
    message: 'You have 2 modules remaining in "Milestone 2: Production Full-Stack Architecture".',
    timestamp: '2 days ago',
    read: true,
    actionUrl: '/roadmap',
  },
  {
    id: 'notif_4',
    type: 'application',
    title: 'Application Status Update: Meta Offer Received',
    message: 'Congratulations! Official software engineering intern offer letter has been recorded.',
    timestamp: '4 days ago',
    read: true,
    actionUrl: '/applications',
  },
];

const defaultResume: ResumeData = {
  personalInfo: {
    fullName: 'Alex Chen',
    email: 'alex.chen@university.edu',
    phone: '+1 (555) 234-5678',
    location: 'San Jose, CA',
    linkedin: 'linkedin.com/in/alexchen-cs',
    github: 'github.com/alexchen-dev',
    summary:
      'Computer Science junior with hands-on experience designing full-stack web applications, TypeScript microservices, and database models. Strong foundation in data structures, algorithms, and modular software engineering with a focus on high reliability.',
  },
  education: [
    {
      id: 'edu_1',
      institution: 'California State University, Silicon Valley',
      degree: 'B.S. in Computer Science',
      field: 'Software Engineering Concentration (GPA: 3.84/4.0)',
      startDate: 'Aug 2023',
      endDate: 'Expected May 2027',
      gpa: '3.84',
    },
  ],
  experience: [
    {
      id: 'exp_1',
      role: 'Full-Stack Developer Intern',
      company: 'Campus Tech Solutions',
      location: 'San Jose, CA',
      startDate: 'June 2025',
      endDate: 'August 2025',
      current: false,
      bullets: [
        'Built full-stack course registration portal serving 12,000+ active students using React, Node.js, and PostgreSQL.',
        'Decreased average API response latencies by 38% through database indexing, query optimization, and response caching.',
        'Collaborated in a 6-person Agile team with bi-weekly sprint planning, code reviews, and automated CI tests.',
      ],
    },
    {
      id: 'exp_2',
      role: 'Undergraduate Teaching Assistant (CS 201: Data Structures)',
      company: 'Department of Computer Science',
      location: 'San Jose, CA',
      startDate: 'Jan 2025',
      endDate: 'May 2025',
      current: false,
      bullets: [
        'Mentored 60+ undergraduate students in memory management, tree structures, recursion, and algorithm complexity.',
        'Conducted weekly programming labs in C++ and held office hours clarifying design patterns.',
      ],
    },
  ],
  projects: [
    {
      id: 'proj_1',
      title: 'Career Pilot AI — Student Placement Platform',
      technologies: ['React', 'TypeScript', 'Node.js', 'Express', 'MongoDB', 'Tailwind CSS'],
      link: 'https://github.com/alexchen-dev/career-pilot-ai',
      bullets: [
        'Engineered full-stack placement portal with Zod request validation, JWT security, and provider-independent AI adapters.',
        'Implemented interactive skill-gap analysis comparing student skills against 100+ industry job descriptions.',
        'Maintained 100% test pass rate with Vitest unit tests for centralized error middleware and standardized envelopes.',
      ],
    },
    {
      id: 'proj_2',
      title: 'Distributed Real-Time Task Dispatcher',
      technologies: ['Node.js', 'TypeScript', 'Redis', 'Docker', 'Jest'],
      link: 'https://github.com/alexchen-dev/task-queue',
      bullets: [
        'Designed asynchronous job queue processing 500+ tasks/second with configurable retry backoff and dead-letter queues.',
        'Containerized multi-service architecture using Docker Compose for reproducible local test environments.',
      ],
    },
  ],
  skills: {
    languages: ['TypeScript', 'JavaScript (ES6+)', 'Python', 'C++', 'SQL'],
    frameworks: ['React.js', 'Node.js', 'Express.js', 'Tailwind CSS', 'Vite'],
    tools: ['Git', 'Docker', 'MongoDB & Mongoose', 'PostgreSQL', 'Vitest', 'Postman'],
    concepts: ['Data Structures & Algorithms', 'RESTful APIs', 'Object-Oriented Design', 'Agile & CI/CD'],
  },
};

const StudentDataContext = createContext<StudentDataContextType | undefined>(undefined);

export const StudentDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<StudentProfile>(() => {
    const saved = localStorage.getItem('cp_student_profile');
    return saved ? JSON.parse(saved) : defaultProfile;
  });

  const [backendProfile, setBackendProfile] = useState<BackendStudentProfile | null>(() =>
    authService.getCachedProfile()
  );
  const [isProfileSyncing, setIsProfileSyncing] = useState<boolean>(false);

  const [jobs, setJobs] = useState<JobOpportunity[]>(defaultJobs);

  const [applications, setApplications] = useState<JobApplication[]>(() => {
    const saved = localStorage.getItem('cp_student_applications');
    return saved ? JSON.parse(saved) : defaultApplications;
  });

  const [roadmaps, setRoadmaps] = useState<RoadmapMilestone[]>(() => {
    const saved = localStorage.getItem('cp_student_roadmaps');
    return saved ? JSON.parse(saved) : defaultRoadmaps;
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('cp_student_notifications');
    return saved ? JSON.parse(saved) : defaultNotifications;
  });

  const [resume, setResume] = useState<ResumeData>(() => {
    const saved = localStorage.getItem('cp_student_resume');
    return saved ? JSON.parse(saved) : defaultResume;
  });

  // Backend Application Tracker State
  const [backendApplications, setBackendApplications] = useState<IJobApplication[]>([]);
  const [applicationStats, setApplicationStats] = useState<ApplicationStatsSummary | null>(null);

  const mapBackendAppToLocal = useCallback((app: IJobApplication): JobApplication => {
    let stage: ApplicationStage = 'applied';
    if (app.status === 'Saved') stage = 'wishlist';
    else if (app.status === 'Applied' || app.status === 'Assessment') stage = 'applied';
    else if (app.status === 'Interview') stage = 'interviewing';
    else if (app.status === 'Offer') stage = 'offered';
    else if (app.status === 'Rejected' || app.status === 'Withdrawn') stage = 'rejected';

    const jobOpportunity =
      typeof app.jobOpportunity === 'object' && app.jobOpportunity !== null
        ? app.jobOpportunity
        : null;

    return {
      id: app._id,
      jobId:
        jobOpportunity?._id ||
        (typeof app.jobOpportunity === 'string' ? app.jobOpportunity : undefined),
      company: app.company,
      role: app.jobTitle,
      location: app.location || (jobOpportunity?.location || 'Remote'),
      type: app.employmentType === 'Full-time' ? 'Full-time' : 'Internship',
      appliedDate: app.appliedDate
        ? new Date(app.appliedDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      stage,
      nextStep: app.interviewDate
        ? `Interview on ${new Date(app.interviewDate).toLocaleDateString()}`
        : app.notes || '',
      interviewDate: app.interviewDate
        ? new Date(app.interviewDate).toLocaleDateString()
        : undefined,
      compensation: app.compensation || '',
      notes: app.notes || '',
    };
  }, []);

  const fetchApplications = useCallback(async (): Promise<IJobApplication[]> => {
    if (!authService.getToken()) return [];
    try {
      const list = await applicationService.getApplications();
      setBackendApplications(list);
      if (list.length > 0) {
        setApplications(list.map(mapBackendAppToLocal));
      }
      return list;
    } catch (err) {
      console.warn('Failed to fetch applications:', err);
      return [];
    }
  }, [mapBackendAppToLocal]);

  const fetchApplicationStats = useCallback(async (): Promise<ApplicationStatsSummary | null> => {
    if (!authService.getToken()) return null;
    try {
      const stats = await applicationService.getApplicationStats();
      setApplicationStats(stats);
      return stats;
    } catch (err) {
      console.warn('Failed to fetch application stats:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    if (authService.getToken()) {
      fetchApplications();
      fetchApplicationStats();
    }
  }, [fetchApplications, fetchApplicationStats]);

  // Career Analysis & Roles Catalog State
  const [latestAnalysis, setLatestAnalysis] = useState<CareerAnalysis | null>(() => {
    const saved = localStorage.getItem('cp_latest_analysis');
    return saved ? JSON.parse(saved) : null;
  });
  const [activeRoadmap, setActiveRoadmap] = useState<BackendLearningRoadmap | null>(() => {
    const saved = localStorage.getItem('cp_active_roadmap');
    return saved ? JSON.parse(saved) : null;
  });
  const [isRoadmapLoading, setIsRoadmapLoading] = useState<boolean>(false);

  const [analysisHistory, setAnalysisHistory] = useState<CareerAnalysis[]>([]);

  const [rolesCatalog, setRolesCatalog] = useState<CareerRole[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Load roles catalog
  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const roles = await careerService.getRoles();
        if (roles && roles.length > 0) {
          setRolesCatalog(roles);
        }
      } catch (err) {
        console.warn('Failed to load roles catalog:', err);
      }
    };
    loadCatalog();
  }, []);

  // Load latest career analysis from backend when authenticated
  const loadLatestAnalysis = useCallback(async () => {
    if (!authService.getToken()) return;
    try {
      const analysis = await careerService.getLatestAnalysis();
      if (analysis) {
        setLatestAnalysis(analysis);
        localStorage.setItem('cp_latest_analysis', JSON.stringify(analysis));
      }
    } catch (err) {
      console.warn('Failed to load latest analysis:', err);
    }
  }, []);

  const fetchAnalysisHistory = useCallback(async () => {
    if (!authService.getToken()) return;
    try {
      const history = await careerService.getAnalysisHistory();
      setAnalysisHistory(history);
    } catch (err) {
      console.warn('Failed to load analysis history:', err);
    }
  }, []);

  const mapBackendRoadmapToMilestones = useCallback((bm: BackendLearningRoadmap): RoadmapMilestone[] => {
    return bm.phases.map((phase) => ({
      id: `phase_${phase.phaseNumber}`,
      title: phase.title,
      targetRole: bm.targetRole.title,
      estimatedWeeks: phase.weeks.length,
      status: phase.status,
      description: phase.description,
      modules: phase.weeks.flatMap((week) =>
        week.tasks.map((task) => ({
          id: task._id,
          title: task.title,
          type:
            task.type === 'DSA'
              ? 'DSA'
              : task.type === 'Project'
              ? 'Project'
              : task.type === 'Reading'
              ? 'Article'
              : 'Course',
          estimatedHours: Math.max(1, Math.round(task.estimatedMinutes / 60)),
          completed: task.completed,
          resourceName: task.resources[0]?.provider || 'Verified Docs',
          resourceUrl: task.resources[0]?.url,
        }))
      ),
    }));
  }, []);

  const fetchActiveRoadmap = useCallback(async (): Promise<BackendLearningRoadmap | null> => {
    if (!authService.getToken()) return null;
    setIsRoadmapLoading(true);
    try {
      const rm = await roadmapService.getActiveRoadmap();
      if (rm) {
        setActiveRoadmap(rm);
        localStorage.setItem('cp_active_roadmap', JSON.stringify(rm));
        setRoadmaps(mapBackendRoadmapToMilestones(rm));
      }
      return rm;
    } catch (err) {
      console.warn('Failed to fetch active roadmap:', err);
      return null;
    } finally {
      setIsRoadmapLoading(false);
    }
  }, [mapBackendRoadmapToMilestones]);

  const generatePersonalizedRoadmap = async (
    payload: GenerateRoadmapPayload = {}
  ): Promise<BackendLearningRoadmap> => {
    setIsRoadmapLoading(true);
    try {
      const rm = await roadmapService.generateRoadmap(payload);
      setActiveRoadmap(rm);
      localStorage.setItem('cp_active_roadmap', JSON.stringify(rm));
      setRoadmaps(mapBackendRoadmapToMilestones(rm));
      return rm;
    } finally {
      setIsRoadmapLoading(false);
    }
  };

  const toggleRoadmapTaskStatus = async (
    taskId: string,
    completed: boolean
  ): Promise<BackendLearningRoadmap> => {
    // Optimistic local update
    if (activeRoadmap) {
      const updated = {
        ...activeRoadmap,
        phases: activeRoadmap.phases.map((phase) => ({
          ...phase,
          weeks: phase.weeks.map((week) => ({
            ...week,
            tasks: week.tasks.map((task) =>
              task._id === taskId
                ? { ...task, completed, completedAt: completed ? new Date().toISOString() : null }
                : task
            ),
          })),
        })),
      };
      setActiveRoadmap(updated);
      setRoadmaps(mapBackendRoadmapToMilestones(updated));
    }

    try {
      const rm = await roadmapService.updateTaskStatus(taskId, completed);
      setActiveRoadmap(rm);
      localStorage.setItem('cp_active_roadmap', JSON.stringify(rm));
      setRoadmaps(mapBackendRoadmapToMilestones(rm));
      return rm;
    } catch (err) {
      // Revert if error occurs
      fetchActiveRoadmap();
      throw err;
    }
  };

  const updateRoadmapSchedule = async (
    payload: UpdateSchedulePayload
  ): Promise<BackendLearningRoadmap> => {
    setIsRoadmapLoading(true);
    try {
      const rm = await roadmapService.updateSchedule(payload);
      setActiveRoadmap(rm);
      localStorage.setItem('cp_active_roadmap', JSON.stringify(rm));
      setRoadmaps(mapBackendRoadmapToMilestones(rm));
      return rm;
    } finally {
      setIsRoadmapLoading(false);
    }
  };

  const regeneratePersonalizedRoadmap = async (
    payload: RegenerateRoadmapPayload = {}
  ): Promise<BackendLearningRoadmap> => {
    setIsRoadmapLoading(true);
    try {
      const rm = await roadmapService.regenerateRoadmap(payload);
      setActiveRoadmap(rm);
      localStorage.setItem('cp_active_roadmap', JSON.stringify(rm));
      setRoadmaps(mapBackendRoadmapToMilestones(rm));
      return rm;
    } finally {
      setIsRoadmapLoading(false);
    }
  };

  useEffect(() => {
    loadLatestAnalysis();
    fetchAnalysisHistory();
    fetchActiveRoadmap();
  }, [loadLatestAnalysis, fetchAnalysisHistory, fetchActiveRoadmap]);


  const runCareerAnalysis = async (roleSlug?: string): Promise<CareerAnalysis> => {
    setIsAnalyzing(true);
    try {
      const result = await careerService.runAnalysis(roleSlug);
      setLatestAnalysis(result);
      localStorage.setItem('cp_latest_analysis', JSON.stringify(result));
      setAnalysisHistory((prev) => [result, ...prev]);
      return result;
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Synchronize backend student profile into frontend representation
  const applyBackendProfile = useCallback((bp: BackendStudentProfile) => {
    setBackendProfile(bp);
    setProfile((prev) => ({
      ...prev,
      id: bp._id || prev.id,
      name: bp.fullName || prev.name,
      email: bp.email || prev.email,
      phone: bp.phone || prev.phone,
      headline: bp.headline || prev.headline,
      bio: bp.headline || prev.bio,
      education: {
        ...prev.education,
        institution: bp.college || prev.education.institution,
        degree: bp.degree || prev.education.degree,
        major: bp.department || prev.education.major,
        graduationYear: bp.graduationYear || prev.education.graduationYear,
      },
      targetRoles:
        bp.careerInterests?.targetRoles && bp.careerInterests.targetRoles.length > 0
          ? bp.careerInterests.targetRoles
          : prev.targetRoles,
      skills:
        bp.skills && bp.skills.length > 0
          ? bp.skills.map((s) => ({
              id: s._id || `sk_${s.name}`,
              name: s.name,
              category: s.category,
              level: s.proficiency,
              verified: Boolean(s.verified),
            }))
          : prev.skills,
      certifications:
        bp.certifications && bp.certifications.length > 0
          ? bp.certifications.map((c) => ({
              id: c._id || `cert_${c.title}`,
              title: c.title,
              issuer: c.issuer,
              issueDate: c.issueDate,
              credentialUrl: c.credentialUrl,
            }))
          : prev.certifications,
    }));
  }, []);

  const syncProfileWithBackend = useCallback(async () => {
    if (!authService.getToken()) return;
    setIsProfileSyncing(true);
    try {
      const bp = await profileService.getProfile();
      applyBackendProfile(bp);
    } catch {
      // Continue gracefully if offline or demo mode
    } finally {
      setIsProfileSyncing(false);
    }
  }, [applyBackendProfile]);

  useEffect(() => {
    syncProfileWithBackend();
  }, [syncProfileWithBackend]);

  // Save to localStorage on changes
  useEffect(() => {
    localStorage.setItem('cp_student_profile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('cp_student_applications', JSON.stringify(applications));
  }, [applications]);

  useEffect(() => {
    localStorage.setItem('cp_student_roadmaps', JSON.stringify(roadmaps));
  }, [roadmaps]);

  useEffect(() => {
    localStorage.setItem('cp_student_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('cp_student_resume', JSON.stringify(resume));
  }, [resume]);

  const updateProfile = async (updated: Partial<StudentProfile>) => {
    setProfile((prev) => ({ ...prev, ...updated }));
    setLatestAnalysis((prev) => (prev ? { ...prev, isStale: true } : null));

    // Persist to backend if authenticated
    if (authService.getToken()) {
      try {
        const bp = await profileService.updateProfile({
          fullName: updated.name,
          phone: updated.phone,
          headline: updated.headline || updated.bio,
          college: updated.education?.institution,
          degree: updated.education?.degree,
          department: updated.education?.major,
          graduationYear: updated.education?.graduationYear,
          careerInterests: updated.targetRoles
            ? { targetRoles: updated.targetRoles }
            : undefined,
        });
        setBackendProfile(bp);
      } catch (err) {
        console.error('Failed to persist profile update to backend:', err);
      }
    }
  };

  const addSkill = async (newSkill: Omit<StudentSkill, 'id' | 'verified'>) => {
    const tempId = `sk_${Date.now()}`;
    const skill: StudentSkill = {
      ...newSkill,
      id: tempId,
      verified: false,
    };
    setProfile((prev) => ({
      ...prev,
      skills: [...prev.skills, skill],
    }));
    setLatestAnalysis((prev) => (prev ? { ...prev, isStale: true } : null));

    // Persist to backend if authenticated
    if (authService.getToken()) {
      try {
        const res = await profileService.addSkill({
          name: newSkill.name,
          category: newSkill.category,
          proficiency: newSkill.level,
          verified: false,
        });
        setBackendProfile(res.profile);
        const serverSkill = res.skills.find(
          (s) => s.name.toLowerCase() === newSkill.name.toLowerCase()
        );
        if (serverSkill?._id) {
          setProfile((prev) => ({
            ...prev,
            skills: prev.skills.map((s) =>
              s.id === tempId ? { ...s, id: serverSkill._id! } : s
            ),
          }));
        }
      } catch (err) {
        console.error('Failed to persist skill addition to backend:', err);
      }
    }
  };

  const removeSkill = async (skillId: string) => {
    setProfile((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s.id !== skillId),
    }));
    setLatestAnalysis((prev) => (prev ? { ...prev, isStale: true } : null));

    // Persist to backend if authenticated
    if (authService.getToken()) {
      try {
        const res = await profileService.removeSkill(skillId);
        setBackendProfile(res.profile);
      } catch (err) {
        // May fail if local mock id
        console.warn('Backend remove skill:', err);
      }
    }
  };

  const addCertification = async (cert: Omit<StudentProfile['certifications'][0], 'id'>) => {
    const tempId = `cert_${Date.now()}`;
    const newCert = { ...cert, id: tempId };
    setProfile((prev) => ({
      ...prev,
      certifications: [...prev.certifications, newCert],
    }));

    if (authService.getToken()) {
      try {
        const res = await profileService.addCertification({
          title: cert.title,
          issuer: cert.issuer,
          issueDate: cert.issueDate,
          credentialUrl: cert.credentialUrl,
        });
        setBackendProfile(res.profile);
        const serverCert = res.certifications.find((c) => c.title === cert.title);
        if (serverCert?._id) {
          setProfile((prev) => ({
            ...prev,
            certifications: prev.certifications.map((c) =>
              c.id === tempId ? { ...c, id: serverCert._id! } : c
            ),
          }));
        }
      } catch (err) {
        console.error('Failed to persist certification to backend:', err);
      }
    }
  };

  const removeCertification = async (certId: string) => {
    setProfile((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((c) => c.id !== certId),
    }));

    if (authService.getToken()) {
      try {
        const res = await profileService.removeCertification(certId);
        setBackendProfile(res.profile);
      } catch (err) {
        console.warn('Backend remove certification:', err);
      }
    }
  };

  const toggleSaveJob = async (jobId: string, notes?: string) => {
    let nextSaved = false;
    setJobs((prev) =>
      prev.map((job) => {
        if (job.id === jobId) {
          nextSaved = !job.isSaved;
          return { ...job, isSaved: nextSaved };
        }
        return job;
      })
    );

    if (authService.getToken()) {
      try {
        if (nextSaved) {
          await jobService.saveJob(jobId, notes);
        } else {
          await jobService.unsaveJob(jobId);
        }
      } catch (err) {
        console.warn('Failed to sync save status with backend:', err);
      }
    }
  };

  const createApplication = async (
    payload: CreateApplicationPayload
  ): Promise<IJobApplication> => {
    const created = await applicationService.createApplication(payload);
    setBackendApplications((prev) => [created, ...prev]);
    setApplications((prev) => [mapBackendAppToLocal(created), ...prev]);
    fetchApplicationStats();
    return created;
  };

  const updateApplication = async (
    id: string,
    payload: UpdateApplicationPayload
  ): Promise<IJobApplication> => {
    const updated = await applicationService.updateApplication(id, payload);
    setBackendApplications((prev) =>
      prev.map((app) => (app._id === id ? updated : app))
    );
    setApplications((prev) =>
      prev.map((app) => (app.id === id ? mapBackendAppToLocal(updated) : app))
    );
    fetchApplicationStats();
    return updated;
  };

  const addApplication = async (newApp: Omit<JobApplication, 'id'>) => {
    let status: ApplicationStatus = 'Applied';
    if (newApp.stage === 'wishlist') status = 'Saved';
    else if (newApp.stage === 'interviewing') status = 'Interview';
    else if (newApp.stage === 'offered') status = 'Offer';
    else if (newApp.stage === 'rejected') status = 'Rejected';

    if (authService.getToken()) {
      try {
        const created = await applicationService.createApplication({
          company: newApp.company,
          jobTitle: newApp.role,
          jobOpportunity: newApp.jobId,
          location: newApp.location,
          employmentType: newApp.type,
          compensation: newApp.compensation,
          status,
          appliedDate: newApp.appliedDate,
          interviewDate: newApp.interviewDate,
          notes: newApp.notes || newApp.nextStep,
        });
        setBackendApplications((prev) => [created, ...prev]);
        setApplications((prev) => [mapBackendAppToLocal(created), ...prev]);
        fetchApplicationStats();
        return;
      } catch (err) {
        console.warn('Failed to persist application to backend:', err);
      }
    }

    const app: JobApplication = {
      ...newApp,
      id: `app_${Date.now()}`,
    };
    setApplications((prev) => [app, ...prev]);
  };

  const updateApplicationStage = async (id: string, stage: ApplicationStage) => {
    let status: ApplicationStatus = 'Applied';
    if (stage === 'wishlist') status = 'Saved';
    else if (stage === 'interviewing') status = 'Interview';
    else if (stage === 'offered') status = 'Offer';
    else if (stage === 'rejected') status = 'Rejected';

    setApplications((prev) =>
      prev.map((app) => (app.id === id ? { ...app, stage } : app))
    );

    if (authService.getToken() && !id.startsWith('app_')) {
      try {
        const updated = await applicationService.updateApplication(id, { status });
        setBackendApplications((prev) =>
          prev.map((app) => (app._id === id ? updated : app))
        );
        fetchApplicationStats();
      } catch (err) {
        console.warn('Failed to persist stage update to backend:', err);
      }
    }
  };

  const deleteApplication = async (id: string) => {
    setApplications((prev) => prev.filter((app) => app.id !== id));
    setBackendApplications((prev) => prev.filter((app) => app._id !== id));

    if (authService.getToken() && !id.startsWith('app_')) {
      try {
        await applicationService.deleteApplication(id);
        fetchApplicationStats();
      } catch (err) {
        console.warn('Failed to delete application on backend:', err);
      }
    }
  };

  const toggleRoadmapItem = (milestoneId: string, moduleId: string) => {
    setRoadmaps((prev) =>
      prev.map((ms) => {
        if (ms.id !== milestoneId) return ms;
        const updatedModules = ms.modules.map((m) =>
          m.id === moduleId ? { ...m, completed: !m.completed } : m
        );
        const allCompleted = updatedModules.every((m) => m.completed);
        const someCompleted = updatedModules.some((m) => m.completed);

        return {
          ...ms,
          modules: updatedModules,
          status: allCompleted ? 'completed' : someCompleted ? 'in-progress' : 'upcoming',
        };
      })
    );
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const updateResume = (updated: Partial<ResumeData>) => {
    setResume((prev) => ({ ...prev, ...updated }));
  };

  const savedJobs = jobs.filter((j) => j.isSaved);

  return (
    <StudentDataContext.Provider
      value={{
        profile,
        backendProfile,
        isProfileSyncing,
        syncProfileWithBackend,
        updateProfile,
        addSkill,
        removeSkill,
        addCertification,
        removeCertification,
        latestAnalysis,
        analysisHistory,
        rolesCatalog,
        isAnalyzing,
        runCareerAnalysis,
        fetchAnalysisHistory,
        jobs,
        savedJobs,
        toggleSaveJob,
        applications,
        backendApplications,
        applicationStats,
        fetchApplications,
        fetchApplicationStats,
        createApplication,
        updateApplication,
        addApplication,
        updateApplicationStage,
        deleteApplication,
        roadmaps,
        toggleRoadmapItem,
        activeRoadmap,
        isRoadmapLoading,
        fetchActiveRoadmap,
        generatePersonalizedRoadmap,
        toggleRoadmapTaskStatus,
        updateRoadmapSchedule,
        regeneratePersonalizedRoadmap,
        notifications,
        markNotificationRead,
        markAllNotificationsRead,
        resume,
        updateResume,
      }}
    >
      {children}
    </StudentDataContext.Provider>
  );
};

export const useStudentData = (): StudentDataContextType => {
  const context = useContext(StudentDataContext);
  if (!context) {
    throw new Error('useStudentData must be used within a StudentDataProvider');
  }
  return context;
};

