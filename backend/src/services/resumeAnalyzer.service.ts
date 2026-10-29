import {
  IResumeAnalysisScores,
  ISectionFeedback,
  IBulletImprovement,
} from '../models/resumeAnalysis.model';
import { CAREER_ROLES_CATALOG } from '../config/careerCatalog.data';
import { llmService } from './ai';
import { logger } from '../utils/logger';

export interface AnalysisInput {
  resumeText: string;
  targetJobTitle?: string;
  targetJobDescription: string;
}

export interface AnalysisOutput {
  scores: IResumeAnalysisScores;
  matchedKeywords: string[];
  missingKeywords: string[];
  sectionFeedback: ISectionFeedback[];
  bulletImprovements: IBulletImprovement[];
  actionableRecommendations: string[];
  atsDisclaimer: string;
}

// Master tech keyword catalog compiled from industry job descriptions and career roles
const KNOWN_KEYWORDS = Array.from(
  new Set([
    // Languages
    'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'golang', 'go', 'rust', 'ruby', 'php', 'swift', 'kotlin', 'sql', 'html', 'css',
    // Frameworks & Libraries
    'react', 'react.js', 'vue', 'angular', 'next.js', 'node.js', 'express', 'express.js', 'nestjs', 'django', 'fastapi', 'flask',
    'spring boot', 'spring', '.net', 'asp.net', 'tailwind', 'tailwind css', 'bootstrap', 'redux', 'zustand',
    // Databases & Caching
    'mongodb', 'postgresql', 'postgres', 'mysql', 'sqlite', 'redis', 'elasticsearch', 'cassandra', 'dynamodb', 'prisma', 'mongoose',
    // Cloud & DevOps
    'docker', 'kubernetes', 'aws', 'amazon web services', 'azure', 'gcp', 'google cloud', 'terraform', 'ci/cd', 'github actions', 'jenkins',
    'linux', 'nginx', 'serverless', 'microservices',
    // Testing & Architecture
    'jest', 'vitest', 'cypress', 'unit testing', 'integration testing', 'rest', 'restful api', 'graphql', 'grpc', 'websocket',
    'git', 'github', 'gitlab', 'agile', 'scrum', 'system design', 'data structures', 'algorithms',
    // Data & AI
    'machine learning', 'deep learning', 'pandas', 'numpy', 'scikit-learn', 'tensorflow', 'pytorch', 'nlp', 'llm', 'computer vision',
    'data analysis', 'power bi', 'tableau', 'spark', 'kafka',
  ])
);

const ACTION_VERBS = [
  'engineered', 'architected', 'spearheaded', 'implemented', 'designed',
  'developed', 'optimized', 'accelerated', 'reduced', 'increased',
  'enhanced', 'automated', 'streamlined', 'deployed', 'resolved',
  'refactored', 'built', 'orchestrated', 'authored', 'established',
];

const WEAK_VERB_PATTERNS = [
  /^worked on\b/i,
  /^responsible for\b/i,
  /^helped with\b/i,
  /^assisted in\b/i,
  /^tasked with\b/i,
  /^participated in\b/i,
  /^did\b/i,
  /^made\b/i,
  /^handled\b/i,
];

export class ResumeAnalyzerService {
  /**
   * Performs complete criteria-based ATS and keyword alignment analysis.
   */
  public async analyzeResume(input: AnalysisInput): Promise<AnalysisOutput> {
    const { resumeText, targetJobTitle = 'Software Engineer', targetJobDescription } = input;
    const lowerResume = resumeText.toLowerCase();
    const lowerJobDesc = targetJobDescription.toLowerCase();

    // 1. Keyword Extraction & Comparison
    const targetKeywords = this.extractKeywordsFromText(lowerJobDesc, targetJobTitle);
    const matchedKeywords: string[] = [];
    const missingKeywords: string[] = [];

    for (const kw of targetKeywords) {
      if (this.containsKeyword(lowerResume, kw)) {
        matchedKeywords.push(this.formatKeyword(kw));
      } else {
        missingKeywords.push(this.formatKeyword(kw));
      }
    }

    // Keyword Match Score (0 - 100)
    const keywordMatchScore =
      targetKeywords.length > 0
        ? Math.min(100, Math.round((matchedKeywords.length / targetKeywords.length) * 100))
        : 75;

    // 2. Section Completeness Audit
    const sectionFeedback = this.auditSections(lowerResume, resumeText);
    const passCount = sectionFeedback.filter((s) => s.status === 'pass').length;
    const warnCount = sectionFeedback.filter((s) => s.status === 'warn').length;
    const sectionCompletenessScore = Math.min(
      100,
      Math.round((passCount * 100 + warnCount * 50) / Math.max(1, sectionFeedback.length))
    );

    // 3. Formatting & Parseability Score
    const formattingScore = this.calculateFormattingScore(resumeText);

    // 4. Impact & Metric Quantification Score
    const { impactScore, bulletImprovements } = await this.evaluateImpactAndBullets(
      resumeText,
      targetJobTitle
    );

    // 5. Overall Weighted ATS Compatibility Score
    // Weighted: Keywords 35%, Completeness 25%, Impact 25%, Formatting 15%
    const overallScore = Math.round(
      keywordMatchScore * 0.35 +
      sectionCompletenessScore * 0.25 +
      impactScore * 0.25 +
      formattingScore * 0.15
    );

    // 6. Actionable Recommendations
    const actionableRecommendations = this.generateActionableRecommendations(
      missingKeywords,
      sectionFeedback,
      impactScore,
      targetJobTitle
    );

    const atsDisclaimer =
      'ATS compatibility scores represent structural and keyword alignment based on industry recruiting best practices. This analysis does not guarantee selection, interview shortlisting, or bypass third-party proprietary ATS algorithms.';

    return {
      scores: {
        overallScore,
        keywordMatchScore,
        formattingScore,
        sectionCompletenessScore,
        impactScore,
      },
      matchedKeywords,
      missingKeywords,
      sectionFeedback,
      bulletImprovements,
      actionableRecommendations,
      atsDisclaimer,
    };
  }

  private extractKeywordsFromText(jobText: string, jobTitle: string): string[] {
    const extracted = new Set<string>();

    // 1. Check known technical keywords
    for (const kw of KNOWN_KEYWORDS) {
      if (this.containsKeyword(jobText, kw)) {
        extracted.add(kw);
      }
    }

    // 2. Add role-specific skills from catalog if relevant
    const matchingRole = CAREER_ROLES_CATALOG.find(
      (r) =>
        r.title.toLowerCase().includes(jobTitle.toLowerCase()) ||
        jobTitle.toLowerCase().includes(r.title.toLowerCase())
    );

    if (matchingRole) {
      for (const skill of matchingRole.requiredSkills) {
        extracted.add(skill.name.toLowerCase());
      }
    }

    // Fallback if very few keywords found in text
    if (extracted.size < 5) {
      ['typescript', 'javascript', 'react', 'node.js', 'git', 'rest', 'sql'].forEach((k) =>
        extracted.add(k)
      );
    }

    return Array.from(extracted);
  }

  private containsKeyword(text: string, keyword: string): boolean {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i');
    return regex.test(text);
  }

  private formatKeyword(kw: string): string {
    const lower = kw.toLowerCase();
    const acronyms = ['aws', 'gcp', 'sql', 'css', 'html', 'ci/cd', 'rest', 'api', 'nlp', 'llm', 'grpc'];
    if (acronyms.includes(lower)) {
      return kw.toUpperCase();
    }
    const specialCases: Record<string, string> = {
      typescript: 'TypeScript',
      javascript: 'JavaScript',
      react: 'React',
      'react.js': 'React.js',
      'node.js': 'Node.js',
      'express.js': 'Express.js',
      'next.js': 'Next.js',
      mongodb: 'MongoDB',
      postgresql: 'PostgreSQL',
      mysql: 'MySQL',
      docker: 'Docker',
      kubernetes: 'Kubernetes',
    };
    if (specialCases[lower]) {
      return specialCases[lower];
    }
    return kw
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  private auditSections(lowerResume: string, rawText: string): ISectionFeedback[] {
    const checks: ISectionFeedback[] = [];

    // Contact Information
    const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(rawText);
    const hasPhone = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(rawText);
    const hasLinks = /linkedin\.com|github\.com|portfolio/i.test(rawText);

    if (hasEmail && hasPhone && hasLinks) {
      checks.push({
        section: 'Contact Information & Links',
        status: 'pass',
        feedback: 'Complete contact information present: valid email, phone number, and professional links.',
      });
    } else if (hasEmail) {
      checks.push({
        section: 'Contact Information & Links',
        status: 'warn',
        feedback: 'Email found, but missing direct phone number or GitHub/LinkedIn profile link.',
      });
    } else {
      checks.push({
        section: 'Contact Information & Links',
        status: 'fail',
        feedback: 'No valid contact email or phone number detected in header.',
      });
    }

    // Professional Summary / Headline
    const hasSummary = /summary|objective|professional overview|about me/i.test(lowerResume);
    if (hasSummary) {
      checks.push({
        section: 'Professional Summary',
        status: 'pass',
        feedback: 'Summary section detected, providing concise career context for recruiters.',
      });
    } else {
      checks.push({
        section: 'Professional Summary',
        status: 'warn',
        feedback: 'Consider adding a 2-3 line executive summary highlighting target role and core strengths.',
      });
    }

    // Skills Section
    const hasSkills = /skills|technical proficiencies|technologies|core competencies/i.test(lowerResume);
    if (hasSkills) {
      checks.push({
        section: 'Technical Skills Matrix',
        status: 'pass',
        feedback: 'Clear technical skills section identified, optimizing automated ATS keyword parsing.',
      });
    } else {
      checks.push({
        section: 'Technical Skills Matrix',
        status: 'fail',
        feedback: 'Missing a dedicated Skills section. ATS scanners look for explicitly tagged competencies.',
      });
    }

    // Experience / Work History
    const hasExperience = /experience|employment|work history|professional background|internship/i.test(lowerResume);
    if (hasExperience) {
      checks.push({
        section: 'Experience & Internships',
        status: 'pass',
        feedback: 'Experience or internship history detected with roles and organizational affiliations.',
      });
    } else {
      checks.push({
        section: 'Experience & Internships',
        status: 'warn',
        feedback: 'Work experience section not clearly marked. If a student, include internships or campus roles.',
      });
    }

    // Projects Section
    const hasProjects = /projects|portfolio|personal projects|academic projects/i.test(lowerResume);
    if (hasProjects) {
      checks.push({
        section: 'Projects & Implementations',
        status: 'pass',
        feedback: 'Projects section present showcasing hands-on application of technical abilities.',
      });
    } else {
      checks.push({
        section: 'Projects & Implementations',
        status: 'warn',
        feedback: 'No dedicated Projects section found. College student resumes benefit heavily from 2-3 detailed projects.',
      });
    }

    // Education
    const hasEducation = /education|university|college|bachelor|master|b\.tech|b\.e|b\.s|degree/i.test(lowerResume);
    if (hasEducation) {
      checks.push({
        section: 'Education & Academics',
        status: 'pass',
        feedback: 'Education history clearly defined with degree, institution, and graduation timeline.',
      });
    } else {
      checks.push({
        section: 'Education & Academics',
        status: 'fail',
        feedback: 'Missing education qualifications or academic degree information.',
      });
    }

    return checks;
  }

  private calculateFormattingScore(text: string): number {
    let score = 90;

    // Length check (ideal single-page or two-page resume is 250 - 1000 words)
    const words = text.split(/\s+/).filter(Boolean).length;
    if (words < 150) {
      score -= 20; // too brief
    } else if (words > 1200) {
      score -= 15; // overly lengthy for student
    }

    // Bullet point density check
    const hasBullets = /(?:^|\n)\s*[-•*]\s+/m.test(text);
    if (!hasBullets) {
      score -= 15; // lack of bullet formatting
    }

    // Excessive capitalization or shouting
    const upperRatio = (text.replace(/[^A-Z]/g, '').length) / Math.max(1, text.length);
    if (upperRatio > 0.25) {
      score -= 10;
    }

    return Math.max(40, Math.min(100, score));
  }

  private async evaluateImpactAndBullets(
    text: string,
    targetRole: string
  ): Promise<{ impactScore: number; bulletImprovements: IBulletImprovement[] }> {
    const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 15);
    const bulletCandidates = lines.filter((line) =>
      /^[-•*]\s+/.test(line) || /^[A-Z][a-z]+ed\b/.test(line)
    );

    let quantifiedCount = 0;
    let strongVerbCount = 0;
    const weakBullets: string[] = [];

    for (const rawLine of bulletCandidates) {
      const cleanLine = rawLine.replace(/^[-•*]\s+/, '').trim();
      const lower = cleanLine.toLowerCase();

      // Check for metrics (% or digits or multiplier like 2x, $ or numbers)
      const hasMetric = /\b\d+(\.\d+)?%|\b\d+\+?|\b\$\d+|\b\d+x\b/i.test(cleanLine);
      if (hasMetric) quantifiedCount++;

      // Check for strong action verb
      const firstWord = lower.split(' ')[0];
      if (ACTION_VERBS.includes(firstWord)) {
        strongVerbCount++;
      }

      // Check if bullet starts with a weak phrasing
      if (WEAK_VERB_PATTERNS.some((pat) => pat.test(cleanLine))) {
        weakBullets.push(cleanLine);
      }
    }

    const totalEvaluated = Math.max(1, bulletCandidates.length);
    const metricRatio = quantifiedCount / totalEvaluated;
    const strongVerbRatio = strongVerbCount / totalEvaluated;

    let impactScore = Math.round(metricRatio * 50 + strongVerbRatio * 50);
    // Baseline minimum for reasonable attempts
    if (impactScore < 45 && bulletCandidates.length > 0) impactScore = 55;
    if (impactScore > 98) impactScore = 98;

    // Pick up to 3 weak bullets to generate grounded improvements for
    const selectedWeak = weakBullets.slice(0, 3);
    if (selectedWeak.length === 0 && bulletCandidates.length > 0) {
      // Pick bullets that lack metrics
      const nonMetric = bulletCandidates
        .map((b) => b.replace(/^[-•*]\s+/, '').trim())
        .filter((b) => !/\b\d+(\.\d+)?%|\b\d+\+?|\b\d+x\b/i.test(b))
        .slice(0, 2);
      selectedWeak.push(...nonMetric);
    }

    const bulletImprovements: IBulletImprovement[] = [];

    for (const original of selectedWeak) {
      const suggestion = await this.generateGroundedBulletRewrite(original, targetRole);
      bulletImprovements.push(suggestion);
    }

    return { impactScore, bulletImprovements };
  }

  /**
   * Rewrites a bullet point following strict groundedness rules:
   * NEVER invent fake companies, GPA, dates, or hallucinations.
   * Focus on action verbs, technical specifics, and structured quantification placeholders.
   */
  private async generateGroundedBulletRewrite(
    original: string,
    targetRole: string
  ): Promise<IBulletImprovement> {
    // Deterministic fallback rule-based enhancement
    let suggested = original;
    let rationale =
      'Replaced passive verb with high-impact action verb and structured the accomplishment around the Google X-Y-Z formula (Accomplished X, measured by Y, by doing Z).';

    const cleaned = original.replace(/^(worked on|responsible for|helped with|assisted in|tasked with)\s+/i, '');

    if (/react|frontend|ui/i.test(cleaned)) {
      suggested = `Architected and developed modular frontend components for ${cleaned}, improving rendering efficiency and state predictability.`;
      rationale = 'Uses active verb "Architected" and emphasizes frontend state & performance outcomes without altering existing responsibilities.';
    } else if (/backend|api|server|database|node/i.test(cleaned)) {
      suggested = `Engineered robust RESTful backend endpoints and optimized database access for ${cleaned}, ensuring high throughput and reliable data handling.`;
      rationale = 'Frames work around backend reliability and performance metrics grounded in the existing implementation.';
    } else if (/test|bug|fix/i.test(cleaned)) {
      suggested = `Identified, diagnosed, and resolved critical defects in ${cleaned}, reducing regression incidents and enhancing test coverage.`;
      rationale = 'Clarifies diagnostic depth and quality assurance impact while maintaining factual accuracy.';
    } else {
      // General strong framing
      const firstWordCapitalized = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
      suggested = `Spearheaded implementation of ${firstWordCapitalized}, streamlining workflow delivery and maintaining clean code quality standards.`;
    }

    // If LLM is configured and not mock, attempt grounded LLM refinement
    try {
      if (llmService.getStatus().isConfigured && !llmService.getStatus().isSimulated) {
        const prompt = `You are a career resume expert. Enhance this resume bullet point for a ${targetRole} candidate.
STRICT GROUNDEDNESS RULES:
1. Do NOT invent fake employers, GPAs, awards, numbers, or fabricated facts.
2. Follow the formula: Strong Action Verb + Technical Details + Measurable/Qualitative Impact.
3. Keep it to one concise sentence.

Original bullet: "${original}"

Return ONLY the single rewritten bullet string, nothing else.`;

        const llmResponse = await llmService.generateCompletion(prompt, { temperature: 0.2 });
        if (llmResponse.text && llmResponse.text.trim().length > 10) {
          suggested = llmResponse.text.trim().replace(/^["']|["']$/g, '').replace(/^[-•*]\s+/, '');
        }
      }
    } catch (err) {
      logger.warn('[ResumeAnalyzer] LLM enhancement failed, using deterministic grounded rewrite:', err);
    }

    return {
      original,
      suggested,
      rationale,
      applied: false,
    };
  }

  private generateActionableRecommendations(
    missingKeywords: string[],
    sectionFeedback: ISectionFeedback[],
    impactScore: number,
    targetRole: string
  ): string[] {
    const recommendations: string[] = [];

    // Keyword recommendations
    if (missingKeywords.length > 0) {
      const topMissing = missingKeywords.slice(0, 4).join(', ');
      recommendations.push(
        `Incorporate missing high-demand target skills: ${topMissing} within relevant project or experience descriptions.`
      );
    }

    // Section recommendations
    for (const check of sectionFeedback) {
      if (check.status === 'warn' || check.status === 'fail') {
        recommendations.push(`${check.section}: ${check.feedback}`);
      }
    }

    // Impact recommendations
    if (impactScore < 70) {
      recommendations.push(
        `Quantify accomplishments: Add specific metrics, percentages, or multipliers (e.g. "reduced latency by 25%", "supported 500+ users") to at least half of your bullet points.`
      );
    }

    recommendations.push(
      `Align with ${targetRole} standards: Ensure technical projects clearly describe your exact architectural contribution, libraries used, and deployment environment.`
    );

    return recommendations.slice(0, 6);
  }
}

export const resumeAnalyzerService = new ResumeAnalyzerService();
