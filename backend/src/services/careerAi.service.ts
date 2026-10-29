import { llmService } from './ai/llm.service';
import { IStudentProfile } from '../models/studentProfile.model';
import { CatalogRoleDefinition } from '../config/careerCatalog.data';
import { DeterministicAnalysisResult } from './careerScoring.service';
import {
  careerAnalysisAiResponseSchema,
} from '../validations/career.validation';
import { ICareerAnalysisExplanation } from '../models/careerAnalysis.model';
import { logger } from '../utils/logger';

export class CareerAiService {
  /**
   * Generates or falls back to explainable recommendations for the career analysis
   */
  public async generateExplanation(
    profile: IStudentProfile,
    role: CatalogRoleDefinition,
    deterministic: DeterministicAnalysisResult
  ): Promise<ICareerAnalysisExplanation> {
    const aiStatus = llmService.getStatus();

    // If active provider is mock, generate a tailored simulated response matching the schema
    // If live provider (Gemini / OpenAI), invoke completion and validate response against Zod
    try {
      const prompt = this.buildPrompt(profile, role, deterministic);
      const completion = await llmService.generateCompletion(prompt, {
        temperature: 0.3,
        maxTokens: 1500,
      });

      const parsedJson = this.extractAndParseJson(completion.text);

      if (parsedJson) {
        const validation = careerAnalysisAiResponseSchema.safeParse(parsedJson);
        if (validation.success) {
          return {
            ...validation.data,
            aiProvider: completion.provider,
            isAiSimulated: completion.isSimulated,
          };
        } else {
          logger.warn('[CareerAiService] LLM output failed schema validation, using structured fallback:', validation.error.format());
        }
      }
    } catch (err) {
      logger.error('[CareerAiService] Failed to generate LLM explanation:', (err as Error).message);
    }

    // Honest fallback generator: provides rich deterministic explanations based on real scores and catalog items
    return this.generateDeterministicFallback(profile, role, deterministic, aiStatus.activeProvider);
  }

  private buildPrompt(
    profile: IStudentProfile,
    role: CatalogRoleDefinition,
    deterministic: DeterministicAnalysisResult
  ): string {
    const matchedSummary = deterministic.matchedSkills
      .map((s) => `${s.name} (Student: ${s.studentLevel}, Required: ${s.requiredLevel}, Status: ${s.status})`)
      .join(', ');

    const missingSummary = deterministic.missingSkills
      .map((s) => `${s.name} (Needed: ${s.requiredLevel}, Importance: ${s.importance})`)
      .join(', ');

    return `
You are Career Pilot AI, an expert technical career advisor for college students.
Analyze the following student profile and deterministic career matching scores for the target role "${role.title}".

STUDENT CONTEXT:
- Name: ${profile.fullName}
- Institution: ${profile.college || 'University Student'}
- Degree/Major: ${profile.degree} in ${profile.department} (Graduation: ${profile.graduationYear || 'Upcoming'})
- Primary Career Goal: ${profile.careerInterests?.careerGoals || 'Prepare for software campus placement drives'}
- Total Projects: ${profile.projects.length}
- Work/Internship History: ${profile.experience.length} experiences

DETERMINISTIC SCORING RESULTS (Calculated by Rule Engine):
- Overall Readiness Score: ${deterministic.scores.readinessScore}/100
- Skill Match Score: ${deterministic.scores.skillMatchScore}/100
- Suitability Level: ${deterministic.scores.suitabilityLevel}
- Matched Skills: ${matchedSummary || 'None'}
- Missing Skills / Gaps: ${missingSummary || 'None'}
- Strengths: ${deterministic.strengths.join('; ')}
- Improvement Areas: ${deterministic.improvementAreas.join('; ')}

ROLE TARGET DETAILS:
- Role: ${role.title} (${role.category})
- Market Demand: ${role.marketDemand}
- Average Entry Salary: ${role.averageSalary.entry}

TASK:
Provide an explainable career analysis and actionable roadmap.
You MUST respond with ONLY a valid, parseable JSON object matching this schema (no surrounding markdown text or explanations outside JSON):

{
  "executiveSummary": "Personalized 2-3 sentence assessment of the student's current fit for ${role.title} based on their education and strengths.",
  "strengthsNarrative": "A detailed explanation of why their existing technical competencies and projects give them an edge in recruiting.",
  "gapAnalysisNarrative": "An objective explanation of the critical missing skills or proficiency gaps, detailing why industry interview loops test them.",
  "tailoredProjects": [
    {
      "title": "Specific Project Name Addressing Missing Gaps",
      "description": "2-3 sentences explaining what to build and architectural components.",
      "skillsCovered": ["Skill1", "Skill2"],
      "impact": "Resume bullet demonstrating readiness"
    }
  ],
  "tailoredCertifications": [
    {
      "title": "Industry Certification Name",
      "issuer": "Issuing Body",
      "priority": "High",
      "reason": "Why this certification bridges their specific gaps"
    }
  ],
  "actionPlan": [
    {
      "timeframe": "Next 1-30 Days",
      "objective": "Primary focus objective",
      "tasks": ["Task 1", "Task 2"]
    },
    {
      "timeframe": "Days 31-60",
      "objective": "Mid-term objective",
      "tasks": ["Task 1", "Task 2"]
    },
    {
      "timeframe": "Days 61-90",
      "objective": "Placement readiness objective",
      "tasks": ["Task 1", "Task 2"]
    }
  ]
}
`.trim();
  }

  private extractAndParseJson(text: string): Record<string, unknown> | null {
    try {
      // Remove markdown code blocks if wrapped (```json ... ```)
      let cleaned = text.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
      }

      // Find first '{' and last '}'
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        cleaned = cleaned.slice(firstBrace, lastBrace + 1);
      }

      return JSON.parse(cleaned);
    } catch {
      return null;
    }
  }

  /**
   * Deterministic, explainable fallback when LLM is unavailable or unconfigured
   */
  public generateDeterministicFallback(
    profile: IStudentProfile,
    role: CatalogRoleDefinition,
    deterministic: DeterministicAnalysisResult,
    providerName: string
  ): ICareerAnalysisExplanation {
    const studentName = profile.fullName || 'Student';
    const readiness = deterministic.scores.readinessScore;

    const criticalMissing = deterministic.missingSkills.filter((s) => s.importance === 'critical');
    const recommendedMissing = deterministic.missingSkills.filter((s) => s.importance === 'recommended');

    const topMissingNames = criticalMissing.slice(0, 3).map((s) => s.name).join(', ') ||
      recommendedMissing.slice(0, 2).map((s) => s.name).join(', ') || 'specialized domain tooling';

    const executiveSummary = `${studentName} demonstrates a ${deterministic.scores.suitabilityLevel} (${readiness}% Readiness Score) for the ${role.title} pathway. With an established foundation in ${deterministic.matchedSkills.slice(0, 3).map((s) => s.name).join(', ') || 'software core concepts'}, the primary focus is now targeting high-yield competencies in ${topMissingNames}.`;

    const strengthsNarrative = deterministic.strengths.length > 0
      ? `Key competitive advantages include verified competencies in ${deterministic.strengths.join(', ')}. These skills form an immediate base for screening clearance in campus placement rounds.`
      : `Your academic coursework in ${profile.department || 'Computer Science'} provides the theoretical background required to rapidly ramp up on role-specific frameworks.`;

    const gapAnalysisNarrative = criticalMissing.length > 0
      ? `To achieve Tier-1 placement readiness, the most critical skill gaps to close are: ${criticalMissing.map((s) => `${s.name} (${s.requiredLevel} expected)`).join('; ')}. Industry technical evaluations prioritize these skills in practical system architecture and live coding rounds.`
      : `You have met the foundational critical requirements for ${role.title}. Enhancing secondary recommended competencies such as ${recommendedMissing.map((s) => s.name).join(', ')} will elevate your resume ranking.`;

    // Tailored projects from catalog or deterministic missing skills
    const tailoredProjects = role.recommendedProjects.map((p) => ({
      title: p.title,
      description: p.description,
      skillsCovered: p.technologies,
      impact: `Demonstrates full lifecycle implementation using ${p.technologies.slice(0, 3).join(', ')} directly aligned with ${role.title} job specifications.`,
    }));

    // Tailored certifications
    const tailoredCertifications = role.recommendedCertifications.map((c) => ({
      title: c.title,
      issuer: c.issuer,
      priority: c.importance === 'high' ? ('High' as const) : ('Medium' as const),
      reason: `Industry-recognized credential that validates standardized competence and boosts initial ATS resume screening.`,
    }));

    // 3-step Milestone Action Plan
    const actionPlan = [
      {
        timeframe: 'Next 1-30 Days',
        objective: 'Bridge Critical Technical Gaps',
        tasks: [
          `Dedicate 15-20 hours mastering ${criticalMissing[0]?.name || role.requiredSkills[0]?.name} through targeted tutorials and coding drills.`,
          `Implement a mini test project integrating ${deterministic.matchedSkills[0]?.name || 'TypeScript'} and ${criticalMissing[0]?.name || 'backend API endpoints'}.`,
        ],
      },
      {
        timeframe: 'Days 31-60',
        objective: 'Construct Capstone Portfolio Project',
        tasks: [
          `Build "${role.recommendedProjects[0]?.title || 'End-to-End Enterprise System'}" incorporating ${role.requiredSkills.slice(0, 3).map((s) => s.name).join(', ')}.`,
          `Document the project architecture on GitHub with live deployment and architectural diagrams.`,
        ],
      },
      {
        timeframe: 'Days 61-90',
        objective: 'Interview Simulation & Placement Prep',
        tasks: [
          `Complete 10 mock technical interview sessions focused on ${role.title} question patterns.`,
          `Tailor ATS resume bullets emphasizing project metrics, latency gains, and verified skills.`,
        ],
      },
    ];

    return {
      executiveSummary,
      strengthsNarrative,
      gapAnalysisNarrative,
      tailoredProjects,
      tailoredCertifications,
      actionPlan,
      aiProvider: `deterministic-fallback (${providerName})`,
      isAiSimulated: true,
    };
  }
}

export const careerAiService = new CareerAiService();
