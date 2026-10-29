import { Types } from 'mongoose';
import { StudentProfile } from '../../models/studentProfile.model';
import { CareerAnalysis } from '../../models/careerAnalysis.model';
import { LearningRoadmap } from '../../models/learningRoadmap.model';
import { JobApplication } from '../../models/jobApplication.model';
import { SavedJob } from '../../models/savedJob.model';
import { ResumeAnalysis } from '../../models/resumeAnalysis.model';
import { InterviewSession } from '../../models/interviewSession.model';
import { CAREER_ROLES_CATALOG, CatalogRoleDefinition } from '../../config/careerCatalog.data';

export interface AssistantContextBundle {
  studentSummary: string | null;
  skillGapsSummary: string | null;
  roadmapSummary: string | null;
  applicationsSummary: string | null;
  savedJobsSummary: string | null;
  resumeSummary: string | null;
  interviewSummary: string | null;
  roleCatalogSummary: string | null;
  platformNavigation: string | null;
  contextTags: string[];
}

export class AssistantContextService {
  /**
   * Selectively retrieves relevant student and platform context based on the user's query
   */
  public async getRelevantContext(
    userId: string,
    query: string
  ): Promise<AssistantContextBundle> {
    const userObjectId = new Types.ObjectId(userId);
    const qLower = query.toLowerCase();

    const contextTags: string[] = [];
    let studentSummary: string | null = null;
    let skillGapsSummary: string | null = null;
    let roadmapSummary: string | null = null;
    let applicationsSummary: string | null = null;
    let savedJobsSummary: string | null = null;
    let resumeSummary: string | null = null;
    let interviewSummary: string | null = null;
    let roleCatalogSummary: string | null = null;
    let platformNavigation: string | null = null;

    // 1. Student Profile Context (foundational)
    try {
      const profile = await StudentProfile.findOne({ user: userObjectId }).lean();
      if (profile) {
        studentSummary =
          `Student: ${profile.fullName || 'Student'}\n` +
          `College: ${profile.college || 'University'}, Degree: ${profile.degree || 'B.S.'} (${profile.department || 'CS'}), Grad Year: ${profile.graduationYear || '2027'}\n` +
          `Target Roles: ${(profile.careerInterests?.targetRoles || []).join(', ') || 'Software Engineer'}\n` +
          `Current Skills: ${profile.skills.map((s) => `${s.name} (${s.proficiency})`).join(', ') || 'None listed yet'}`;
        contextTags.push('Student Profile');
      }
    } catch {
      // ignore
    }

    // 2. Skill Gap & Career Analysis Context (if query relates to skills, gaps, readiness, analysis, match)
    const isSkillRelated =
      qLower.includes('skill') ||
      qLower.includes('gap') ||
      qLower.includes('readiness') ||
      qLower.includes('analysis') ||
      qLower.includes('match') ||
      qLower.includes('strength') ||
      qLower.includes('improve');

    if (isSkillRelated) {
      try {
        const analysis = await CareerAnalysis.findOne({ user: userObjectId })
          .sort({ createdAt: -1 })
          .lean();
        if (analysis) {
          const missingCrit = (analysis.missingSkills || [])
            .filter((s) => s.importance === 'critical')
            .map((s) => s.name)
            .join(', ');
          const missingRec = (analysis.missingSkills || [])
            .filter((s) => s.importance === 'recommended')
            .map((s) => s.name)
            .join(', ');

          const readinessScore = analysis.scores?.readinessScore ?? 0;
          const suitability = analysis.scores?.suitabilityLevel ?? 'Moderate Match';
          const certs = (analysis.aiExplanation?.tailoredCertifications || [])
            .map((c: { title: string }) => c.title)
            .join(', ');

          skillGapsSummary =
            `Latest Career Analysis: Target Role "${analysis.targetRole?.title || 'Target Role'}"\n` +
            `Readiness Score: ${readinessScore}% (${suitability})\n` +
            `Critical Missing Skills: ${missingCrit || 'None'}\n` +
            `Recommended Missing Skills: ${missingRec || 'None'}\n` +
            `Recommended Certifications: ${certs || 'Standard industry certifications'}`;
          contextTags.push('Skill Gap Analysis');
        }
      } catch {
        // ignore
      }
    }

    // 3. Learning Roadmap Context (if query relates to roadmap, learning, phase, week, study, task)
    const isRoadmapRelated =
      qLower.includes('roadmap') ||
      qLower.includes('learn') ||
      qLower.includes('study') ||
      qLower.includes('course') ||
      qLower.includes('task') ||
      qLower.includes('curriculum') ||
      qLower.includes('module') ||
      qLower.includes('week');

    if (isRoadmapRelated) {
      try {
        const roadmap = await LearningRoadmap.findOne({
          user: userObjectId,
          status: { $in: ['in-progress', 'active', 'not-started'] },
        })
          .sort({ updatedAt: -1 })
          .lean();

        if (roadmap) {
          const upcoming = roadmap.phases
            .flatMap((p) => p.weeks.flatMap((w) => w.tasks))
            .filter((t) => !t.completed)
            .slice(0, 3)
            .map((t) => `"${t.title}" (~${t.estimatedMinutes}m, type: ${t.type})`)
            .join('; ');

          roadmapSummary =
            `Active Learning Roadmap: ${roadmap.targetRole?.title || 'Target Track'}\n` +
            `Pace: ${roadmap.weeklyHours} hrs/week over ${roadmap.totalWeeks} weeks\n` +
            `Progress: ${roadmap.completedTasks}/${roadmap.totalTasks} tasks completed (${roadmap.overallProgress}%)\n` +
            `Upcoming Tasks: ${upcoming || 'All current phase tasks completed'}`;
          contextTags.push('Active Roadmap');
        }
      } catch {
        // ignore
      }
    }

    // 4. Job Applications & Interviews Context (if query relates to job, apply, interview, company, status, follow-up)
    const isAppRelated =
      qLower.includes('apply') ||
      qLower.includes('application') ||
      qLower.includes('interview') ||
      qLower.includes('follow up') ||
      qLower.includes('follow-up') ||
      qLower.includes('company') ||
      qLower.includes('stage') ||
      qLower.includes('tracker');

    if (isAppRelated) {
      try {
        const apps = await JobApplication.find({ user: userObjectId })
          .sort({ appliedDate: -1 })
          .limit(8)
          .lean();

        if (apps.length > 0) {
          const appSummaries = apps.map((a) => {
            let note = `${a.company} (${a.jobTitle}) - Stage: ${a.status}`;
            if (a.interviewDate) {
              note += ` [Interview: ${new Date(a.interviewDate).toLocaleDateString()}]`;
            }
            if (a.followUpDate) {
              note += ` [Follow-up: ${new Date(a.followUpDate).toLocaleDateString()}]`;
            }
            return note;
          });

          applicationsSummary = `Tracked Applications (${apps.length} total):\n- ` + appSummaries.join('\n- ');
          contextTags.push('Tracked Applications');
        }
      } catch {
        // ignore
      }
    }

    // 5. Saved Opportunities Context (if query relates to saved jobs, bookmarks, recommendations)
    const isSavedJobsRelated =
      qLower.includes('saved') ||
      qLower.includes('bookmark') ||
      qLower.includes('vacancy') ||
      qLower.includes('opportunity');

    if (isSavedJobsRelated) {
      try {
        const saved = await SavedJob.find({ user: userObjectId })
          .populate('job', 'title company location employmentType')
          .limit(5)
          .lean();

        if (saved.length > 0) {
          const list = saved
            .map((s) => {
              const opp = s.job as unknown as { title?: string; company?: string; location?: string } | null;
              return opp ? `${opp.company} - ${opp.title} (${opp.location})` : null;
            })
            .filter(Boolean);

          if (list.length > 0) {
            savedJobsSummary = `Saved Opportunities (${list.length}):\n- ` + list.join('\n- ');
            contextTags.push('Saved Jobs');
          }
        }
      } catch {
        // ignore
      }
    }

    // 6. Resume Analysis Context (if query relates to resume, cv, ats, bullet, projects, formatting)
    const isResumeRelated =
      qLower.includes('resume') ||
      qLower.includes('cv') ||
      qLower.includes('ats') ||
      qLower.includes('bullet') ||
      qLower.includes('keyword');

    if (isResumeRelated) {
      try {
        const resumeAnalysis = await ResumeAnalysis.findOne({ user: userObjectId })
          .sort({ createdAt: -1 })
          .lean();

        if (resumeAnalysis) {
          resumeSummary =
            `Latest Resume ATS Review: Target "${resumeAnalysis.targetJobTitle || 'Software Engineering'}"\n` +
            `ATS Match Score: ${resumeAnalysis.scores?.overallScore ?? 0}/100\n` +
            `Missing Keywords: ${(resumeAnalysis.missingKeywords || []).slice(0, 8).join(', ') || 'Good keyword alignment'}\n` +
            `Improvement Tips: ${(resumeAnalysis.actionableRecommendations || []).slice(0, 3).join('; ') || 'Use quantifiable impact metrics'}`;
          contextTags.push('Resume ATS Analysis');
        }
      } catch {
        // ignore
      }
    }

    // 7. Interview Practice History Context (if query relates to mock interview, behavioral, technical screen)
    const isInterviewPracticeRelated =
      qLower.includes('interview') ||
      qLower.includes('prep') ||
      qLower.includes('question') ||
      qLower.includes('star') ||
      qLower.includes('mock') ||
      qLower.includes('technical screen');

    if (isInterviewPracticeRelated) {
      try {
        const sessions = await InterviewSession.find({ user: userObjectId })
          .sort({ createdAt: -1 })
          .limit(3)
          .lean();

        if (sessions.length > 0) {
          const sessionList = sessions.map((s) => {
            const answered = s.questions.filter((q) => q.studentAnswer).length;
            const score = s.summary?.overallScore ?? 0;
            return `"${s.targetRole}" (${s.interviewType}, ${s.difficulty}) - Completed ${answered}/${s.totalQuestions} questions, Score: ${score}%`;
          });

          interviewSummary = `Recent Practice Sessions:\n- ` + sessionList.join('\n- ');
          contextTags.push('Interview Practice Sessions');
        }
      } catch {
        // ignore
      }
    }

    // 8. Career Role Catalog Matching (if user asks about a specific career role)
    for (const role of CAREER_ROLES_CATALOG) {
      if (
        qLower.includes(role.title.toLowerCase()) ||
        qLower.includes(role.slug.replace(/-/g, ' '))
      ) {
        roleCatalogSummary =
          `Role Profile: ${role.title} (${role.category})\n` +
          `Overview: ${role.description}\n` +
          `Salary Range: ${role.averageSalary.entry} (Entry) to ${role.averageSalary.mid} (Mid) ${role.averageSalary.currency}\n` +
          `Key Skills Expected: ${role.requiredSkills.map((s) => `${s.name} (${s.minProficiency}, ${s.importance})`).join(', ')}\n` +
          `Recommended Projects: ${role.recommendedProjects.map((p) => p.title).join('; ')}`;
        contextTags.push(`Role Catalog: ${role.title}`);
        break;
      }
    }

    // 9. Platform Navigation & Features (if user asks where to go or how to find something)
    const isNavRelated =
      qLower.includes('where') ||
      qLower.includes('how do i') ||
      qLower.includes('navigate') ||
      qLower.includes('page') ||
      qLower.includes('find') ||
      qLower.includes('go to');

    if (isNavRelated) {
      platformNavigation =
        `Platform Directory:\n` +
        `- Dashboard: /dashboard (central overview, progress, notifications)\n` +
        `- Student Profile: /profile (edit education, skills, certifications, target roles)\n` +
        `- Career Analysis: /career-analysis (AI career role suitability assessment)\n` +
        `- Skill Gap: /skill-gap (gap breakdown against target job requirements)\n` +
        `- Learning Roadmap: /roadmap (structured phase/week curriculum with practical tasks)\n` +
        `- Job & Internship Discovery: /jobs (search verified and demonstration opportunities)\n` +
        `- Resume Builder: /resume-builder (design & export professional resumes to PDF)\n` +
        `- Resume ATS Analyzer: /resume-analysis (upload PDF/DOCX for ATS score & keyword recommendations)\n` +
        `- AI Interview Prep: /interview-prep (interactive technical and HR mock simulator)\n` +
        `- Application Tracker: /applications (Kanban board & table for tracking placement stages)`;
      contextTags.push('Platform Navigation');
    }

    return {
      studentSummary,
      skillGapsSummary,
      roadmapSummary,
      applicationsSummary,
      savedJobsSummary,
      resumeSummary,
      interviewSummary,
      roleCatalogSummary,
      platformNavigation,
      contextTags,
    };
  }

  /**
   * Retrieves specific Catalog Role by slug or title
   */
  public getCatalogRole(query: string): CatalogRoleDefinition | undefined {
    const q = query.toLowerCase().trim();
    return CAREER_ROLES_CATALOG.find(
      (r) =>
        r.slug.toLowerCase() === q ||
        r.title.toLowerCase() === q ||
        r.title.toLowerCase().includes(q)
    );
  }
}

export const assistantContextService = new AssistantContextService();
