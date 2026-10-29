import { CatalogRoleDefinition, CatalogSkillRequirement } from '../config/careerCatalog.data';
import { IStudentProfile } from '../models/studentProfile.model';
import { IRoadmapPhase, IRoadmapTask, IRoadmapWeek, RoadmapTaskType } from '../models/learningRoadmap.model';
import { getVerifiedResourcesForSkill } from '../config/learningResources.data';
import { llmService } from './ai/llm.service';
import { logger } from '../utils/logger';

export interface GenerateRoadmapParams {
  profile: IStudentProfile;
  role: CatalogRoleDefinition;
  weeklyHours: number;
  totalWeeks: number;
  existingCompletedTasks?: Map<string, { completedAt: Date | null }>;
}

export class RoadmapGeneratorService {
  /**
   * Generates a fully sequenced, actionable, and persistent learning roadmap
   */
  public async generateRoadmap(params: GenerateRoadmapParams): Promise<{
    phases: IRoadmapPhase[];
    isAiPersonalized: boolean;
    aiProvider: string;
  }> {
    const { profile, role, weeklyHours, totalWeeks, existingCompletedTasks } = params;

    // Identify student's missing or developing skills vs target role requirements
    const studentSkillMap = new Map<string, string>();
    for (const s of profile.skills || []) {
      studentSkillMap.set(s.name.toLowerCase().trim(), s.proficiency);
    }

    const missingSkills: CatalogSkillRequirement[] = [];
    const existingSkills: CatalogSkillRequirement[] = [];

    for (const req of role.requiredSkills) {
      const studentProf = studentSkillMap.get(req.name.toLowerCase().trim());
      if (!studentProf) {
        missingSkills.push(req);
      } else if (
        (req.minProficiency === 'Advanced' && studentProf !== 'Advanced') ||
        (req.minProficiency === 'Intermediate' && studentProf === 'Beginner')
      ) {
        missingSkills.push(req);
      } else {
        existingSkills.push(req);
      }
    }

    // Sort missing skills by importance (critical first) and then weight descending
    missingSkills.sort((a, b) => {
      if (a.importance === 'critical' && b.importance !== 'critical') return -1;
      if (a.importance !== 'critical' && b.importance === 'critical') return 1;
      return b.weight - a.weight;
    });

    // Partition total weeks across 3 learning phases
    const phase1WeeksCount = Math.max(1, Math.round(totalWeeks * 0.38));
    const phase2WeeksCount = Math.max(1, Math.round(totalWeeks * 0.37));
    const phase3WeeksCount = Math.max(1, totalWeeks - phase1WeeksCount - phase2WeeksCount);

    const phases: IRoadmapPhase[] = [];

    // Phase 1: Core Competency Foundations & Skill Gaps
    const phase1Weeks = this.generateWeeksForPhase({
      startWeek: 1,
      weekCount: phase1WeeksCount,
      role,
      phaseType: 'foundations',
      skillsToFocus: missingSkills.slice(0, Math.max(2, Math.ceil(missingSkills.length / 2))),
      weeklyHours,
      existingCompletedTasks,
    });

    phases.push({
      phaseNumber: 1,
      title: 'Foundations & Critical Skill-Gap Remediation',
      description: `Targeted sprint focusing on closing primary prerequisite gaps (${missingSkills.slice(0, 3).map((s) => s.name).join(', ') || role.requiredSkills.slice(0, 3).map((s) => s.name).join(', ')}) required for ${role.title} technical rounds.`,
      status: 'in-progress',
      progress: 0,
      weeks: phase1Weeks,
    });

    // Phase 2: Advanced Architecture & Applied Systems
    const phase2Weeks = this.generateWeeksForPhase({
      startWeek: phase1WeeksCount + 1,
      weekCount: phase2WeeksCount,
      role,
      phaseType: 'architecture',
      skillsToFocus: missingSkills.length > 2 ? missingSkills.slice(2) : role.requiredSkills.slice(3, 7),
      weeklyHours,
      existingCompletedTasks,
    });

    phases.push({
      phaseNumber: 2,
      title: 'Advanced Architecture & Industry Design Patterns',
      description: `Production-ready backend architecture, distributed data access, state management, caching, and scalable engineering patterns.`,
      status: 'upcoming',
      progress: 0,
      weeks: phase2Weeks,
    });

    // Phase 3: Capstone Engineering & Placement Interview Prep
    const phase3Weeks = this.generateWeeksForPhase({
      startWeek: phase1WeeksCount + phase2WeeksCount + 1,
      weekCount: phase3WeeksCount,
      role,
      phaseType: 'capstone',
      skillsToFocus: role.requiredSkills.slice(0, 4),
      weeklyHours,
      existingCompletedTasks,
    });

    phases.push({
      phaseNumber: 3,
      title: 'Capstone Engineering & Placement Interview Sprint',
      description: `End-to-end full capstone project deployment, portfolio presentation, coding data structures & algorithms drills, and system design interviews.`,
      status: 'upcoming',
      progress: 0,
      weeks: phase3Weeks,
    });

    // Try AI personalization if configured
    let isAiPersonalized = false;
    let aiProvider = 'deterministic';

    try {
      const aiStatus = llmService.getStatus();
      if (aiStatus.isConfigured && aiStatus.activeProvider !== 'mock') {
        const enhancedPhases = await this.enhanceRoadmapWithAi(phases, profile, role);
        if (enhancedPhases) {
          isAiPersonalized = true;
          aiProvider = aiStatus.activeProvider;
          return { phases: enhancedPhases, isAiPersonalized, aiProvider };
        }
      }
    } catch (err) {
      logger.warn('[RoadmapGenerator] AI enhancement skipped, continuing with deterministic plan:', (err as Error).message);
    }

    return { phases, isAiPersonalized, aiProvider };
  }

  /**
   * Builds weeks and tasks within a phase according to weekly study budget
   */
  private generateWeeksForPhase(params: {
    startWeek: number;
    weekCount: number;
    role: CatalogRoleDefinition;
    phaseType: 'foundations' | 'architecture' | 'capstone';
    skillsToFocus: CatalogSkillRequirement[];
    weeklyHours: number;
    existingCompletedTasks?: Map<string, { completedAt: Date | null }>;
  }): IRoadmapWeek[] {
    const { startWeek, weekCount, role, phaseType, skillsToFocus, weeklyHours, existingCompletedTasks } = params;
    const weeks: IRoadmapWeek[] = [];

    // Weekly time budget in minutes
    const totalWeeklyMinutes = weeklyHours * 60;

    for (let i = 0; i < weekCount; i++) {
      const currentWeekNum = startWeek + i;
      const primarySkill = skillsToFocus[i % Math.max(1, skillsToFocus.length)] || role.requiredSkills[i % role.requiredSkills.length];
      const skillName = primarySkill?.name || 'Software Engineering';

      let theme = '';
      const tasks: IRoadmapTask[] = [];

      if (phaseType === 'foundations') {
        theme = `Mastering Core ${skillName} & Industry Fundamentals`;
        tasks.push(
          this.createTask({
            taskKey: `${role.slug}-fnd-${skillName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-concept`,
            title: `Deep-Dive: Core Principles and Best Practices of ${skillName}`,
            type: 'Concept',
            learningObjective: `Understand fundamental semantics, lifecycle, memory model, and typing structures for ${skillName} in production.`,
            estimatedMinutes: Math.round(totalWeeklyMinutes * 0.3),
            skillQuery: skillName,
            existingCompletedTasks,
          }),
          this.createTask({
            taskKey: `${role.slug}-fnd-${skillName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-lab`,
            title: `Hands-On Lab: Build Modular Exercise using ${skillName}`,
            type: 'Hands-on Exercise',
            learningObjective: `Construct an isolated practical module implementing unit tests and error handling with ${skillName}.`,
            estimatedMinutes: Math.round(totalWeeklyMinutes * 0.4),
            skillQuery: skillName,
            existingCompletedTasks,
          }),
          this.createTask({
            taskKey: `${role.slug}-fnd-dsa-w${currentWeekNum}`,
            title: `Data Structures & Problem Solving: Arrays, Hashing & Two Pointers`,
            type: 'DSA',
            learningObjective: `Solve 4 medium-level algorithmic questions on LeetCode/NeetCode reinforcing time/space trade-offs.`,
            estimatedMinutes: Math.round(totalWeeklyMinutes * 0.3),
            skillQuery: 'dsa',
            existingCompletedTasks,
          })
        );
      } else if (phaseType === 'architecture') {
        theme = `Scalable Architecture, Data Access & ${skillName}`;
        tasks.push(
          this.createTask({
            taskKey: `${role.slug}-arch-${skillName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-concept`,
            title: `Architectural Patterns & Scaling Strategies for ${skillName}`,
            type: 'Concept',
            learningObjective: `Design clean layering, dependency injection, and caching invalidation strategies.`,
            estimatedMinutes: Math.round(totalWeeklyMinutes * 0.25),
            skillQuery: skillName,
            existingCompletedTasks,
          }),
          this.createTask({
            taskKey: `${role.slug}-arch-perf-api`,
            title: `Production Optimization: High-Throughput REST APIs & Indexing`,
            type: 'Hands-on Exercise',
            learningObjective: `Benchmark API response times, add database query indexes, and configure Redis caching for sub-50ms latency.`,
            estimatedMinutes: Math.round(totalWeeklyMinutes * 0.45),
            skillQuery: 'system design',
            existingCompletedTasks,
          }),
          this.createTask({
            taskKey: `${role.slug}-arch-sysdesign-w${currentWeekNum}`,
            title: `System Design Screen: Designing a Scalable URL Shortener or Feed Service`,
            type: 'Reading',
            learningObjective: `Deconstruct high-level architecture: load balancers, database sharding, and message queues.`,
            estimatedMinutes: Math.round(totalWeeklyMinutes * 0.3),
            skillQuery: 'system design',
            existingCompletedTasks,
          })
        );
      } else {
        // Capstone Phase
        theme = `Capstone Engineering & Placement Interview Simulation`;
        const capstoneProject = role.recommendedProjects[0] || {
          title: `Full-Stack ${role.title} Portfolio Application`,
          technologies: [skillName, 'Docker', 'Git'],
        };

        tasks.push(
          this.createTask({
            taskKey: `${role.slug}-capstone-sprint-${currentWeekNum}`,
            title: `Sprint Implementation: ${capstoneProject.title}`,
            type: 'Project',
            learningObjective: `Ship an end-to-end full feature set with authentication, database persistence, and documentation in GitHub.`,
            estimatedMinutes: Math.round(totalWeeklyMinutes * 0.5),
            skillQuery: capstoneProject.technologies[0] || skillName,
            existingCompletedTasks,
          }),
          this.createTask({
            taskKey: `${role.slug}-capstone-docker-deploy`,
            title: `Containerize and Deploy with Docker & CI/CD Pipeline`,
            type: 'Hands-on Exercise',
            learningObjective: `Write a multi-stage Dockerfile, configure GitHub Actions workflow, and deploy to cloud hosting.`,
            estimatedMinutes: Math.round(totalWeeklyMinutes * 0.25),
            skillQuery: 'docker',
            existingCompletedTasks,
          }),
          this.createTask({
            taskKey: `${role.slug}-capstone-interview-drill-w${currentWeekNum}`,
            title: `Mock Placement Technical Round: DSA + Core Subject Questions`,
            type: 'Assessment',
            learningObjective: `Simulate a 45-minute live coding round on graphs/trees followed by OS/DBMS core interview concepts.`,
            estimatedMinutes: Math.round(totalWeeklyMinutes * 0.25),
            skillQuery: 'dsa',
            existingCompletedTasks,
          })
        );
      }

      weeks.push({
        weekNumber: currentWeekNum,
        theme,
        tasks,
      });
    }

    return weeks;
  }

  /**
   * Creates a single validated roadmap task, checking for existing completion
   */
  private createTask(params: {
    taskKey: string;
    title: string;
    type: RoadmapTaskType;
    learningObjective: string;
    estimatedMinutes: number;
    skillQuery: string;
    existingCompletedTasks?: Map<string, { completedAt: Date | null }>;
  }): IRoadmapTask {
    const { taskKey, title, type, learningObjective, estimatedMinutes, skillQuery, existingCompletedTasks } = params;

    const resources = getVerifiedResourcesForSkill(skillQuery);

    // Check if task was completed in a previous version of the roadmap
    const normalizedTitle = title.toLowerCase().trim();
    let isCompleted = false;
    let completedAt: Date | null = null;

    if (existingCompletedTasks) {
      if (existingCompletedTasks.has(taskKey)) {
        isCompleted = true;
        completedAt = existingCompletedTasks.get(taskKey)?.completedAt || new Date();
      } else if (existingCompletedTasks.has(normalizedTitle)) {
        isCompleted = true;
        completedAt = existingCompletedTasks.get(normalizedTitle)?.completedAt || new Date();
      }
    }

    return {
      taskKey,
      title,
      type,
      learningObjective,
      estimatedMinutes: Math.max(15, estimatedMinutes),
      completed: isCompleted,
      completedAt: isCompleted ? (completedAt || new Date()) : null,
      resources,
    };
  }

  /**
   * AI Personalization hook: enriches task descriptions and objectives
   */
  private async enhanceRoadmapWithAi(
    phases: IRoadmapPhase[],
    profile: IStudentProfile,
    role: CatalogRoleDefinition
  ): Promise<IRoadmapPhase[] | null> {
    try {
      const prompt = `You are Career Pilot AI. Review and personalize the learning objectives for this student's roadmap.
Student: ${profile.fullName}, studying ${profile.degree} in ${profile.department} at ${profile.college}.
Target Role: ${role.title} (${role.category}).

Input phases: ${JSON.stringify(
        phases.map((p) => ({
          phaseNumber: p.phaseNumber,
          weeks: p.weeks.map((w) => ({
            weekNumber: w.weekNumber,
            theme: w.theme,
            tasks: w.tasks.map((t) => ({ taskKey: t.taskKey, title: t.title, learningObjective: t.learningObjective })),
          })),
        }))
      )}

Return a JSON array of updated objectives keyed by taskKey:
[{"taskKey": "...", "learningObjective": "..."}]`;

      const completion = await llmService.generateCompletion(prompt, { temperature: 0.2, maxTokens: 1200 });
      const jsonStart = completion.text.indexOf('[');
      const jsonEnd = completion.text.lastIndexOf(']');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const parsed = JSON.parse(completion.text.substring(jsonStart, jsonEnd + 1)) as Array<{
          taskKey: string;
          learningObjective: string;
        }>;
        const objectiveMap = new Map<string, string>();
        for (const item of parsed) {
          if (item.taskKey && item.learningObjective) {
            objectiveMap.set(item.taskKey, item.learningObjective);
          }
        }

        // Apply enhanced objectives
        for (const phase of phases) {
          for (const week of phase.weeks) {
            for (const task of week.tasks) {
              if (objectiveMap.has(task.taskKey)) {
                task.learningObjective = objectiveMap.get(task.taskKey)!;
              }
            }
          }
        }
        return phases;
      }
    } catch {
      // Fallback cleanly to default generated roadmap
    }
    return null;
  }
}

export const roadmapGeneratorService = new RoadmapGeneratorService();
