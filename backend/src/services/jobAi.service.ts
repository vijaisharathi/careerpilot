import { IJobOpportunity } from '../models/jobOpportunity.model';
import { IStudentProfile } from '../models/studentProfile.model';
import { IJobMatchResult } from './jobMatching.service';
import { llmService } from './ai/llm.service';
import { logger } from '../utils/logger';

export interface IJobAiInsights {
  roleSummary: string;
  gapBridgeTip: string;
  resumeOptimizationTip: string;
  isAiSimulated: boolean;
  aiProvider: string;
}

export class JobAiService {
  /**
   * Generates tailored requirement insights and skill gap explanations for an opportunity.
   * Uses LLM where available, or falls back gracefully to a deterministic template.
   */
  public async generateInsights(
    job: IJobOpportunity,
    profile: IStudentProfile,
    match: IJobMatchResult
  ): Promise<IJobAiInsights> {
    const aiStatus = llmService.getStatus();

    try {
      if (aiStatus.isConfigured && aiStatus.activeProvider !== 'mock') {
        const prompt = `You are Career Pilot AI, advising a college student on their fit for this job posting.
OPPORTUNITY:
- Title: ${job.title}
- Company: ${job.company}
- Location: ${job.location} (${job.workMode})
- Key Required Skills: ${job.requiredSkills.map((s) => s.name).join(', ')}

STUDENT PROFILE:
- Name: ${profile.fullName}
- Degree: ${profile.degree} in ${profile.department}
- Match Score: ${match.matchScore}% (${match.suitability})
- Matched Skills: ${match.matchedSkills.map((s) => s.name).join(', ') || 'None'}
- Missing Skills: ${match.missingSkills.map((s) => s.name).join(', ') || 'None'}

TASK:
Provide brief, actionable advice. Respond with ONLY valid JSON:
{
  "roleSummary": "2 sentences describing what ${job.company} values most for this vacancy.",
  "gapBridgeTip": "1-2 sentences on how the student can bridge missing skills (${match.missingSkills.map((s) => s.name).slice(0, 2).join(', ') || 'N/A'}) before interview rounds.",
  "resumeOptimizationTip": "1 sentence on which matched skills to highlight on their resume."
}`;

        const completion = await llmService.generateCompletion(prompt, { temperature: 0.3, maxTokens: 400 });
        const jsonStart = completion.text.indexOf('{');
        const jsonEnd = completion.text.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
          const parsed = JSON.parse(completion.text.substring(jsonStart, jsonEnd + 1));
          if (parsed.roleSummary && parsed.gapBridgeTip && parsed.resumeOptimizationTip) {
            return {
              roleSummary: parsed.roleSummary,
              gapBridgeTip: parsed.gapBridgeTip,
              resumeOptimizationTip: parsed.resumeOptimizationTip,
              isAiSimulated: false,
              aiProvider: completion.provider,
            };
          }
        }
      }
    } catch (err) {
      logger.warn('[JobAiService] LLM insight generation skipped, falling back to deterministic template:', (err as Error).message);
    }

    // High quality deterministic fallback
    return this.generateDeterministicFallback(job, profile, match);
  }

  private generateDeterministicFallback(
    job: IJobOpportunity,
    profile: IStudentProfile,
    match: IJobMatchResult
  ): IJobAiInsights {
    const matchedNames = match.matchedSkills.map((s) => s.name);
    const missingNames = match.missingSkills.map((s) => s.name);

    let roleSummary = `${job.company} is seeking candidates for ${job.title} with solid fundamentals in ${job.requiredSkills.slice(0, 3).map((s) => s.name).join(', ')}.`;

    let gapBridgeTip =
      missingNames.length > 0
        ? `Focus on demonstrating working knowledge of ${missingNames.slice(0, 2).join(' and ')} through a targeted portfolio sprint or open-source contribution.`
        : `Your technical skill profile covers all primary qualifications. Emphasize your system architecture and problem-solving depth.`;

    let resumeOptimizationTip =
      matchedNames.length > 0
        ? `Prominently showcase ${matchedNames.slice(0, 2).join(' and ')} in your project bullet points with measurable impact metrics.`
        : `Tailor your resume summary to align with ${job.company}'s technology stack.`;

    return {
      roleSummary,
      gapBridgeTip,
      resumeOptimizationTip,
      isAiSimulated: true,
      aiProvider: 'deterministic-fallback',
    };
  }
}

export const jobAiService = new JobAiService();

