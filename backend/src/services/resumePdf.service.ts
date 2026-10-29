import { Buffer } from 'buffer';
import PDFDocument from 'pdfkit';
import { IResumeDocument } from '../models/resumeDocument.model';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

type PDFDoc = InstanceType<typeof PDFDocument>;

export class ResumePdfService {
  /**
   * Generates a high-quality, ATS-friendly PDF buffer from a ResumeDocument.
   */
  public async generatePdfBuffer(resume: IResumeDocument): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 36, // ~0.5 inch margins standard for resumes
          info: {
            Title: `${resume.personalInfo.fullName} - Resume`,
            Author: resume.personalInfo.fullName,
            Subject: resume.targetRole || 'Resume',
            Creator: 'Career Pilot AI',
          },
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', (err) => {
          logger.error('[ResumePdfService] Stream error:', err);
          reject(new AppError('Failed to generate PDF document stream.', 500));
        });

        this.renderResume(doc, resume);
        doc.end();
      } catch (err) {
        logger.error('[ResumePdfService] Generation exception:', err);
        reject(new AppError('Failed to render PDF resume.', 500));
      }
    });
  }

  private renderResume(doc: PDFDoc, resume: IResumeDocument): void {
    const template = resume.templateId || 'modern-clean';

    // 1. Render Header based on template style
    this.renderHeader(doc, resume, template);

    // 2. Render Body Sections in configured sectionOrder
    const order = resume.sectionOrder && resume.sectionOrder.length > 0
      ? resume.sectionOrder
      : ['summary', 'skills', 'experience', 'projects', 'education', 'certifications'];

    for (const section of order) {
      switch (section.toLowerCase()) {
        case 'summary':
          this.renderSummary(doc, resume, template);
          break;
        case 'skills':
          this.renderSkills(doc, resume, template);
          break;
        case 'experience':
          this.renderExperience(doc, resume, template);
          break;
        case 'projects':
          this.renderProjects(doc, resume, template);
          break;
        case 'education':
          this.renderEducation(doc, resume, template);
          break;
        case 'certifications':
          this.renderCertifications(doc, resume, template);
          break;
      }
    }
  }

  private renderHeader(
    doc: PDFDoc,
    resume: IResumeDocument,
    template: string
  ): void {
    const { personalInfo } = resume;

    // Primary accent colors per template
    let primaryColor = '#0f172a'; // slate-900
    let accentColor = '#2563eb'; // blue-600

    if (template === 'technical-classic') {
      primaryColor = '#1e293b';
      accentColor = '#0284c7';
    } else if (template === 'minimalist-executive') {
      primaryColor = '#18181b';
      accentColor = '#52525b';
    } else if (template === 'academic-research') {
      primaryColor = '#111827';
      accentColor = '#4338ca';
    }

    // Candidate Name
    doc
      .fillColor(primaryColor)
      .font('Helvetica-Bold')
      .fontSize(template === 'minimalist-executive' ? 22 : 20)
      .text(personalInfo.fullName || 'Candidate Name', { align: template === 'technical-classic' ? 'left' : 'center' });

    // Headline or Target Role
    const headlineText = personalInfo.headline || resume.targetRole || '';
    if (headlineText) {
      doc
        .moveDown(0.2)
        .fillColor(accentColor)
        .font('Helvetica-Bold')
        .fontSize(10.5)
        .text(headlineText.toUpperCase(), {
          align: template === 'technical-classic' ? 'left' : 'center',
          characterSpacing: 0.5,
        });
    }

    // Contact Details Row
    const contactParts: string[] = [];
    if (personalInfo.email) contactParts.push(personalInfo.email);
    if (personalInfo.phone) contactParts.push(personalInfo.phone);
    if (personalInfo.location) contactParts.push(personalInfo.location);
    if (personalInfo.linkedin) contactParts.push(personalInfo.linkedin);
    if (personalInfo.github) contactParts.push(personalInfo.github);
    if (personalInfo.portfolio) contactParts.push(personalInfo.portfolio);

    if (contactParts.length > 0) {
      doc
        .moveDown(0.3)
        .fillColor('#475569')
        .font('Helvetica')
        .fontSize(8.5)
        .text(contactParts.join('  •  '), {
          align: template === 'technical-classic' ? 'left' : 'center',
        });
    }

    // Header divider line
    doc.moveDown(0.5);
    const startX = doc.page.margins.left;
    const endX = doc.page.width - doc.page.margins.right;
    const currentY = doc.y;

    doc
      .strokeColor('#cbd5e1')
      .lineWidth(0.8)
      .moveTo(startX, currentY)
      .lineTo(endX, currentY)
      .stroke();

    doc.moveDown(0.6);
  }

  private renderSectionHeading(
    doc: PDFDoc,
    title: string,
    template: string
  ): void {
    // Check if near page bottom, add page if needed
    if (doc.y > doc.page.height - 100) {
      doc.addPage();
    }

    let headingColor = '#0f172a';
    if (template === 'academic-research') headingColor = '#312e81';

    doc
      .moveDown(0.4)
      .fillColor(headingColor)
      .font('Helvetica-Bold')
      .fontSize(11)
      .text(title.toUpperCase(), { characterSpacing: 0.5 });

    const y = doc.y;
    const startX = doc.page.margins.left;
    const endX = doc.page.width - doc.page.margins.right;

    doc
      .strokeColor('#e2e8f0')
      .lineWidth(0.5)
      .moveTo(startX, y + 1)
      .lineTo(endX, y + 1)
      .stroke();

    doc.moveDown(0.4);
  }

  private renderSummary(
    doc: PDFDoc,
    resume: IResumeDocument,
    template: string
  ): void {
    const summary = resume.personalInfo.summary;
    if (!summary || !summary.trim()) return;

    this.renderSectionHeading(doc, 'Professional Summary', template);
    doc
      .fillColor('#334155')
      .font('Helvetica')
      .fontSize(9.5)
      .lineGap(2)
      .text(summary.trim());
  }

  private renderSkills(
    doc: PDFDoc,
    resume: IResumeDocument,
    template: string
  ): void {
    const skills = resume.skills;
    if (!skills || skills.length === 0) return;

    this.renderSectionHeading(doc, 'Technical Skills', template);

    // Group skills by category
    const categories: Record<string, string[]> = {};
    for (const s of skills) {
      const cat = s.category ? s.category.replace('_', ' ') : 'General';
      const catTitle = cat.charAt(0).toUpperCase() + cat.slice(1);
      if (!categories[catTitle]) categories[catTitle] = [];
      categories[catTitle].push(s.name);
    }

    for (const [catName, skillNames] of Object.entries(categories)) {
      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor('#1e293b')
        .text(`${catName}: `, { continued: true })
        .font('Helvetica')
        .fillColor('#475569')
        .text(skillNames.join(', '));
      doc.moveDown(0.15);
    }
  }

  private renderExperience(
    doc: PDFDoc,
    resume: IResumeDocument,
    template: string
  ): void {
    const experience = resume.experience;
    if (!experience || experience.length === 0) return;

    this.renderSectionHeading(doc, 'Experience & Internships', template);

    for (const exp of experience) {
      if (doc.y > doc.page.height - 80) doc.addPage();

      // Row: Role & Dates
      const dateRange = `${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}`;
      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor('#0f172a')
        .text(exp.role, { continued: true })
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor('#64748b')
        .text(dateRange, { align: 'right' });

      // Row: Company & Location
      const orgInfo = exp.location ? `${exp.company}  |  ${exp.location}` : exp.company;
      doc
        .font('Helvetica-Oblique')
        .fontSize(9)
        .fillColor('#2563eb')
        .text(orgInfo);

      // Bullets
      if (exp.bullets && exp.bullets.length > 0) {
        doc.moveDown(0.2);
        for (const bullet of exp.bullets) {
          if (!bullet.trim()) continue;
          doc
            .font('Helvetica')
            .fontSize(8.8)
            .fillColor('#334155')
            .lineGap(1.5)
            .text(`•   ${bullet.trim()}`, { indent: 10 });
        }
      }

      doc.moveDown(0.4);
    }
  }

  private renderProjects(
    doc: PDFDoc,
    resume: IResumeDocument,
    template: string
  ): void {
    const projects = resume.projects;
    if (!projects || projects.length === 0) return;

    this.renderSectionHeading(doc, 'Key Projects', template);

    for (const proj of projects) {
      if (doc.y > doc.page.height - 80) doc.addPage();

      // Title & Link
      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor('#0f172a')
        .text(proj.title, { continued: !!proj.link });

      if (proj.link) {
        doc
          .font('Helvetica')
          .fontSize(8.5)
          .fillColor('#2563eb')
          .text(`  [${proj.link}]`, { align: 'right' });
      }

      // Technologies used
      if (proj.technologies && proj.technologies.length > 0) {
        doc
          .font('Helvetica-Oblique')
          .fontSize(8.5)
          .fillColor('#64748b')
          .text(`Technologies: ${proj.technologies.join(', ')}`);
      }

      // Bullets
      if (proj.bullets && proj.bullets.length > 0) {
        doc.moveDown(0.15);
        for (const bullet of proj.bullets) {
          if (!bullet.trim()) continue;
          doc
            .font('Helvetica')
            .fontSize(8.8)
            .fillColor('#334155')
            .lineGap(1.5)
            .text(`•   ${bullet.trim()}`, { indent: 10 });
        }
      }

      doc.moveDown(0.35);
    }
  }

  private renderEducation(
    doc: PDFDoc,
    resume: IResumeDocument,
    template: string
  ): void {
    const education = resume.education;
    if (!education || education.length === 0) return;

    this.renderSectionHeading(doc, 'Education', template);

    for (const edu of education) {
      if (doc.y > doc.page.height - 70) doc.addPage();

      const dates = `${edu.startDate} - ${edu.endDate}`;
      doc
        .font('Helvetica-Bold')
        .fontSize(9.5)
        .fillColor('#0f172a')
        .text(`${edu.degree} in ${edu.field}`, { continued: true })
        .font('Helvetica')
        .fontSize(8.8)
        .fillColor('#64748b')
        .text(dates, { align: 'right' });

      let details = edu.institution;
      if (edu.gpa) details += `  •  GPA: ${edu.gpa}`;
      if (edu.honors) details += `  •  Honors: ${edu.honors}`;

      doc
        .font('Helvetica')
        .fontSize(8.8)
        .fillColor('#475569')
        .text(details);

      doc.moveDown(0.25);
    }
  }

  private renderCertifications(
    doc: PDFDoc,
    resume: IResumeDocument,
    template: string
  ): void {
    const certs = resume.certifications;
    if (!certs || certs.length === 0) return;

    this.renderSectionHeading(doc, 'Certifications & Credentials', template);

    for (const cert of certs) {
      if (doc.y > doc.page.height - 60) doc.addPage();

      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor('#0f172a')
        .text(cert.title, { continued: true })
        .font('Helvetica')
        .fontSize(8.5)
        .fillColor('#64748b')
        .text(`  —  ${cert.issuer} (${cert.issueDate})`);

      doc.moveDown(0.15);
    }
  }
}

export const resumePdfService = new ResumePdfService();
