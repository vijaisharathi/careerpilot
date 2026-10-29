import { Buffer } from 'buffer';
import { Types } from 'mongoose';
import {
  ResumeDocument,
  IResumeDocument,
  IResumeDocumentData,
  ResumeTemplateId,
} from '../models/resumeDocument.model';
import {
  ResumeAnalysis,
  IResumeAnalysis,
} from '../models/resumeAnalysis.model';
import { StudentProfile } from '../models/studentProfile.model';
import { resumePdfService } from './resumePdf.service';
import { resumeAnalyzerService } from './resumeAnalyzer.service';
import { extractTextFromDocument } from '../utils/documentExtractor';
import { AppError } from '../utils/appError';

export interface CreateResumeInput {
  title?: string;
  targetRole?: string;
  jobId?: string;
  templateId?: ResumeTemplateId;
  sectionOrder?: string[];
  personalInfo?: Partial<IResumeDocument['personalInfo']>;
  education?: IResumeDocument['education'];
  experience?: IResumeDocument['experience'];
  projects?: IResumeDocument['projects'];
  skills?: IResumeDocument['skills'];
  certifications?: IResumeDocument['certifications'];
}

export interface AnalyzeResumeRequestInput {
  resumeId?: string;
  fileBuffer?: Buffer;
  originalFileName?: string;
  mimeType?: string;
  targetJobTitle?: string;
  targetJobDescription: string;
  jobId?: string;
}

export class ResumeService {
  /**
   * Retrieves all resumes belonging to an authenticated student.
   */
  public async getResumes(userId: string): Promise<IResumeDocument[]> {
    return ResumeDocument.find({ user: new Types.ObjectId(userId) })
      .sort({ updatedAt: -1 })
      .lean() as unknown as Promise<IResumeDocument[]>;
  }

  /**
   * Retrieves a single resume ensuring user ownership.
   */
  public async getResumeById(id: string, userId: string): Promise<IResumeDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid resume ID format.', 400);
    }

    const resume = await ResumeDocument.findById(id);
    if (!resume) {
      throw new AppError('Resume not found.', 404);
    }

    if (resume.user.toString() !== userId) {
      throw new AppError('You are not authorized to access this resume.', 403);
    }

    return resume;
  }

  /**
   * Creates a new resume document.
   */
  public async createResume(
    userId: string,
    data: CreateResumeInput
  ): Promise<IResumeDocument> {
    const resume = new ResumeDocument({
      user: new Types.ObjectId(userId),
      title: data.title || 'My Resume',
      targetRole: data.targetRole || '',
      jobId: data.jobId && Types.ObjectId.isValid(data.jobId) ? new Types.ObjectId(data.jobId) : null,
      templateId: data.templateId || 'modern-clean',
      sectionOrder: data.sectionOrder || [
        'personal',
        'summary',
        'skills',
        'experience',
        'projects',
        'education',
        'certifications',
      ],
      personalInfo: {
        fullName: data.personalInfo?.fullName || '',
        email: data.personalInfo?.email || '',
        phone: data.personalInfo?.phone || '',
        location: data.personalInfo?.location || '',
        headline: data.personalInfo?.headline || '',
        summary: data.personalInfo?.summary || '',
        linkedin: data.personalInfo?.linkedin || '',
        github: data.personalInfo?.github || '',
        portfolio: data.personalInfo?.portfolio || '',
      },
      education: data.education || [],
      experience: data.experience || [],
      projects: data.projects || [],
      skills: data.skills || [],
      certifications: data.certifications || [],
      version: 1,
      isCurrentDraft: true,
    });

    await resume.save();
    return resume;
  }

  /**
   * Populates a brand-new resume directly from the student's saved profile.
   */
  public async populateFromProfile(
    userId: string,
    options?: { templateId?: ResumeTemplateId; targetRole?: string }
  ): Promise<IResumeDocument> {
    const profile = await StudentProfile.findOne({ user: new Types.ObjectId(userId) });

    if (!profile) {
      throw new AppError(
        'Student profile not found. Please complete your profile before generating a resume.',
        400
      );
    }

    const targetRole =
      options?.targetRole ||
      (profile.careerInterests?.targetRoles && profile.careerInterests.targetRoles.length > 0
        ? profile.careerInterests.targetRoles[0]
        : 'Software Engineer');

    const mappedSkills = (profile.skills || []).map((s) => ({
      name: s.name,
      category: s.category || 'languages',
      proficiency: s.proficiency || 'Intermediate',
    }));

    const mappedEducation = (profile.educationHistory || []).map((e) => ({
      institution: e.institution,
      degree: e.degree,
      field: e.field,
      startDate: e.startDate,
      endDate: e.endDate,
      gpa: e.gpa || '',
    }));

    // If educationHistory was empty, fall back to profile primary education
    if (mappedEducation.length === 0 && profile.college) {
      mappedEducation.push({
        institution: profile.college,
        degree: profile.degree || 'Bachelor of Technology',
        field: profile.department || 'Computer Science',
        startDate: '2021',
        endDate: profile.graduationYear ? profile.graduationYear.toString() : '2025',
        gpa: '',
      });
    }

    const mappedExperience = (profile.experience || []).map((e) => ({
      role: e.role,
      company: e.company,
      location: e.location || '',
      startDate: e.startDate,
      endDate: e.endDate,
      current: e.current ?? false,
      bullets: e.bullets || [],
    }));

    const mappedProjects = (profile.projects || []).map((p) => ({
      title: p.title,
      technologies: p.technologies || [],
      link: p.link || '',
      bullets: p.bullets || [],
    }));

    const mappedCertifications = (profile.certifications || []).map((c) => ({
      title: c.title,
      issuer: c.issuer,
      issueDate: c.issueDate,
      credentialUrl: c.credentialUrl || '',
    }));

    const resume = new ResumeDocument({
      user: new Types.ObjectId(userId),
      title: `${targetRole} - Profile Import`,
      targetRole,
      templateId: options?.templateId || 'modern-clean',
      sectionOrder: [
        'personal',
        'summary',
        'skills',
        'experience',
        'projects',
        'education',
        'certifications',
      ],
      personalInfo: {
        fullName: profile.fullName || '',
        email: profile.email || '',
        phone: profile.phone || '',
        location: profile.location || '',
        headline: profile.headline || `${targetRole} Candidate`,
        summary: profile.careerInterests?.careerGoals || '',
        linkedin: '',
        github: '',
        portfolio: '',
      },
      education: mappedEducation,
      experience: mappedExperience,
      projects: mappedProjects,
      skills: mappedSkills,
      certifications: mappedCertifications,
      version: 1,
      isCurrentDraft: true,
    });

    await resume.save();
    return resume;
  }

  /**
   * Updates an existing resume document.
   */
  public async updateResume(
    id: string,
    userId: string,
    data: Partial<IResumeDocumentData>
  ): Promise<IResumeDocument> {
    const resume = await this.getResumeById(id, userId);

    if (data.title !== undefined) resume.title = data.title;
    if (data.targetRole !== undefined) resume.targetRole = data.targetRole;
    if (data.templateId !== undefined) resume.templateId = data.templateId;
    if (data.sectionOrder !== undefined) resume.sectionOrder = data.sectionOrder;
    if (data.personalInfo !== undefined) {
      resume.personalInfo = {
        ...resume.personalInfo,
        ...data.personalInfo,
      };
    }
    if (data.education !== undefined) resume.education = data.education;
    if (data.experience !== undefined) resume.experience = data.experience;
    if (data.projects !== undefined) resume.projects = data.projects;
    if (data.skills !== undefined) resume.skills = data.skills;
    if (data.certifications !== undefined) resume.certifications = data.certifications;
    if (data.isCurrentDraft !== undefined) resume.isCurrentDraft = data.isCurrentDraft;

    await resume.save();
    return resume;
  }

  /**
   * Creates a snapshot/version of the current resume.
   */
  public async createResumeVersion(
    id: string,
    userId: string
  ): Promise<IResumeDocument> {
    const original = await this.getResumeById(id, userId);

    const versionDoc = new ResumeDocument({
      user: original.user,
      title: `${original.title} (v${original.version + 1})`,
      targetRole: original.targetRole,
      jobId: original.jobId,
      templateId: original.templateId,
      sectionOrder: original.sectionOrder,
      personalInfo: original.personalInfo,
      education: original.education,
      experience: original.experience,
      projects: original.projects,
      skills: original.skills,
      certifications: original.certifications,
      version: original.version + 1,
      isCurrentDraft: true,
      parentResumeId: original._id,
    });

    // Mark original as no longer the active draft
    original.isCurrentDraft = false;
    await original.save();
    await versionDoc.save();

    return versionDoc;
  }

  /**
   * Creates a tailored variant for a specific job application.
   */
  public async createResumeVariant(
    id: string,
    userId: string,
    targetRole: string,
    jobId?: string
  ): Promise<IResumeDocument> {
    const original = await this.getResumeById(id, userId);

    const variant = new ResumeDocument({
      user: original.user,
      title: `${original.title} - ${targetRole}`,
      targetRole,
      jobId: jobId && Types.ObjectId.isValid(jobId) ? new Types.ObjectId(jobId) : null,
      templateId: original.templateId,
      sectionOrder: original.sectionOrder,
      personalInfo: {
        ...original.personalInfo,
        headline: `${targetRole} Specialist`,
      },
      education: original.education,
      experience: original.experience,
      projects: original.projects,
      skills: original.skills,
      certifications: original.certifications,
      version: 1,
      isCurrentDraft: true,
      parentResumeId: original._id,
    });

    await variant.save();
    return variant;
  }

  /**
   * Deletes a resume document.
   */
  public async deleteResume(id: string, userId: string): Promise<void> {
    const resume = await this.getResumeById(id, userId);
    await resume.deleteOne();
  }

  /**
   * Validates that required fields are present before PDF export.
   */
  public validateResumeForExport(resume: IResumeDocument): void {
    if (!resume.personalInfo?.fullName || !resume.personalInfo.fullName.trim()) {
      throw new AppError('Candidate full name is required for PDF export.', 400);
    }

    if (!resume.personalInfo?.email || !resume.personalInfo.email.trim()) {
      throw new AppError('Contact email is required for PDF export.', 400);
    }

    const hasEducation = resume.education && resume.education.length > 0;
    const hasSkills = resume.skills && resume.skills.length > 0;

    if (!hasEducation && !hasSkills) {
      throw new AppError(
        'Resume must contain at least one Education entry or Technical Skill for export.',
        400
      );
    }
  }

  /**
   * Generates a PDF buffer for a resume document.
   */
  public async exportResumePdf(id: string, userId: string): Promise<Buffer> {
    const resume = await this.getResumeById(id, userId);
    this.validateResumeForExport(resume);
    return resumePdfService.generatePdfBuffer(resume);
  }

  /**
   * Performs complete criteria-based ATS analysis on either an uploaded file or an existing ResumeDocument.
   */
  public async analyzeResume(
    userId: string,
    input: AnalyzeResumeRequestInput
  ): Promise<IResumeAnalysis> {
    if (!input.targetJobDescription || input.targetJobDescription.trim().length < 20) {
      throw new AppError(
        'Target job description must be provided (at least 20 characters) to analyze ATS alignment.',
        400
      );
    }

    let resumeText = '';
    let originalFileName: string | undefined;
    let fileSize: number | undefined;
    let mimeType: string | undefined;
    let resumeDocumentId: Types.ObjectId | undefined;

    if (input.fileBuffer) {
      // Analyze from uploaded file
      const docResult = await extractTextFromDocument(
        input.fileBuffer,
        input.mimeType || 'application/pdf',
        input.originalFileName || 'resume.pdf'
      );
      resumeText = docResult.text;
      originalFileName = input.originalFileName;
      fileSize = input.fileBuffer.length;
      mimeType = input.mimeType;
    } else if (input.resumeId) {
      // Analyze from saved ResumeDocument
      const resume = await this.getResumeById(input.resumeId, userId);
      resumeDocumentId = resume._id;
      resumeText = this.convertResumeDocumentToText(resume);
    } else {
      throw new AppError(
        'Please provide either a resume file upload or select an existing resume document.',
        400
      );
    }

    const targetJobTitle = input.targetJobTitle || 'Software Engineer';

    // Execute comprehensive criteria-based analysis
    const analysisResult = await resumeAnalyzerService.analyzeResume({
      resumeText,
      targetJobTitle,
      targetJobDescription: input.targetJobDescription,
    });

    const analysis = new ResumeAnalysis({
      user: new Types.ObjectId(userId),
      resumeDocumentId: resumeDocumentId || null,
      originalFileName,
      fileSize,
      mimeType,
      targetJobTitle,
      targetJobDescription: input.targetJobDescription,
      jobId: input.jobId && Types.ObjectId.isValid(input.jobId) ? new Types.ObjectId(input.jobId) : null,
      extractedTextLength: resumeText.length,
      extractedTextPreview: resumeText.slice(0, 300) + '...',
      scores: analysisResult.scores,
      matchedKeywords: analysisResult.matchedKeywords,
      missingKeywords: analysisResult.missingKeywords,
      sectionFeedback: analysisResult.sectionFeedback,
      bulletImprovements: analysisResult.bulletImprovements,
      actionableRecommendations: analysisResult.actionableRecommendations,
      atsDisclaimer: analysisResult.atsDisclaimer,
    });

    await analysis.save();
    return analysis;
  }

  /**
   * Retrieves previous resume analyses for the user.
   */
  public async getAnalysisHistory(userId: string): Promise<IResumeAnalysis[]> {
    return ResumeAnalysis.find({ user: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .lean() as unknown as Promise<IResumeAnalysis[]>;
  }

  /**
   * Retrieves a single analysis by ID ensuring user ownership.
   */
  public async getAnalysisById(id: string, userId: string): Promise<IResumeAnalysis> {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid analysis ID format.', 400);
    }

    const analysis = await ResumeAnalysis.findById(id);
    if (!analysis) {
      throw new AppError('Resume analysis record not found.', 404);
    }

    if (analysis.user.toString() !== userId) {
      throw new AppError('You are not authorized to view this analysis record.', 403);
    }

    return analysis;
  }

  /**
   * Applies an accepted bullet improvement into an existing resume.
   */
  public async applyBulletImprovement(
    resumeId: string,
    userId: string,
    original: string,
    suggested: string
  ): Promise<IResumeDocument> {
    const resume = await this.getResumeById(resumeId, userId);
    let matched = false;

    // Check experience bullets
    for (const exp of resume.experience) {
      for (let i = 0; i < exp.bullets.length; i++) {
        if (exp.bullets[i].trim() === original.trim()) {
          exp.bullets[i] = suggested.trim();
          matched = true;
          break;
        }
      }
      if (matched) break;
    }

    // Check project bullets if not found in experience
    if (!matched) {
      for (const proj of resume.projects) {
        for (let i = 0; i < proj.bullets.length; i++) {
          if (proj.bullets[i].trim() === original.trim()) {
            proj.bullets[i] = suggested.trim();
            matched = true;
            break;
          }
        }
        if (matched) break;
      }
    }

    if (!matched) {
      // Append as high-impact bullet to first project or experience if exact match not found
      if (resume.projects.length > 0) {
        resume.projects[0].bullets.push(suggested.trim());
      } else if (resume.experience.length > 0) {
        resume.experience[0].bullets.push(suggested.trim());
      }
    }

    await resume.save();
    return resume;
  }

  /**
   * Formats a ResumeDocument into plain structured text for parsing and analysis.
   */
  private convertResumeDocumentToText(resume: IResumeDocument): string {
    const lines: string[] = [];
    const { personalInfo } = resume;

    lines.push(personalInfo.fullName);
    lines.push([personalInfo.email, personalInfo.phone, personalInfo.location].filter(Boolean).join(' | '));
    lines.push([personalInfo.linkedin, personalInfo.github, personalInfo.portfolio].filter(Boolean).join(' | '));

    if (personalInfo.summary) {
      lines.push('\nProfessional Summary');
      lines.push(personalInfo.summary);
    }

    if (resume.skills && resume.skills.length > 0) {
      lines.push('\nTechnical Skills');
      lines.push(resume.skills.map((s) => s.name).join(', '));
    }

    if (resume.experience && resume.experience.length > 0) {
      lines.push('\nExperience & Work History');
      for (const exp of resume.experience) {
        lines.push(`${exp.role} at ${exp.company} (${exp.startDate} - ${exp.current ? 'Present' : exp.endDate})`);
        for (const b of exp.bullets) {
          lines.push(`- ${b}`);
        }
      }
    }

    if (resume.projects && resume.projects.length > 0) {
      lines.push('\nProjects');
      for (const p of resume.projects) {
        lines.push(`${p.title} (${p.technologies.join(', ')})`);
        for (const b of p.bullets) {
          lines.push(`- ${b}`);
        }
      }
    }

    if (resume.education && resume.education.length > 0) {
      lines.push('\nEducation');
      for (const e of resume.education) {
        lines.push(`${e.degree} in ${e.field}, ${e.institution} (${e.startDate} - ${e.endDate}) GPA: ${e.gpa || 'N/A'}`);
      }
    }

    if (resume.certifications && resume.certifications.length > 0) {
      lines.push('\nCertifications');
      for (const c of resume.certifications) {
        lines.push(`${c.title} by ${c.issuer} (${c.issueDate})`);
      }
    }

    return lines.join('\n');
  }
}

export const resumeService = new ResumeService();
