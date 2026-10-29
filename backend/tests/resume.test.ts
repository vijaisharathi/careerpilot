import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import m from 'mongoose';
import PDFDocument from 'pdfkit';
import app from '../src/app';
import { User } from '../src/models/user.model';
import { StudentProfile } from '../src/models/studentProfile.model';
import { ResumeDocument } from '../src/models/resumeDocument.model';
import { ResumeAnalysis } from '../src/models/resumeAnalysis.model';
import { validateFileSignature, sanitizeExtractedText } from '../src/utils/documentExtractor';

const TEST_DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/career_pilot_ai_test';

/**
 * Helper to generate a minimal valid PDF Buffer in memory for testing.
 */
function createTestPdfBuffer(text: string): Promise<Buffer> {
  return new Promise((resolve) => {
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.text(text);
    doc.end();
  });
}

describe('Resume Builder & Resume Analyzer Module', () => {
  let tokenUserA = '';
  let tokenUserB = '';
  let resumeIdUserA = '';

  const studentA = {
    name: 'Aarav Sharma',
    email: 'aarav.sharma@resumetest.com',
    password: 'Password2026!',
    profile: {
      college: 'Georgia Tech',
      degree: 'B.S.',
      department: 'Computer Science',
      graduationYear: 2026,
      skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker'],
      targetRoles: ['Full-Stack Developer'],
      careerGoals: 'Build highly scalable distributed web applications.',
    },
  };

  const studentB = {
    name: 'Neha Verma',
    email: 'neha.verma@resumetest.com',
    password: 'Password2026!',
    profile: {
      college: 'MIT',
      degree: 'M.S.',
      department: 'EECS',
      graduationYear: 2026,
      skills: ['Python', 'PyTorch'],
      targetRoles: ['Machine Learning Engineer'],
    },
  };

  beforeAll(async () => {
    if (m.connection.readyState === 0) {
      await m.connect(TEST_DB_URI);
    }
    await User.deleteMany({ email: /@resumetest\.com$/ });
    await StudentProfile.deleteMany({ email: /@resumetest\.com$/ });
    await ResumeDocument.deleteMany({});
    await ResumeAnalysis.deleteMany({});

    // Register Student A
    const regResA = await request(app).post('/api/auth/register').send({
      name: studentA.name,
      email: studentA.email,
      password: studentA.password,
      role: 'student',
    });
    tokenUserA = regResA.body.data.token;

    // Create Profile A
    await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({
        college: studentA.profile.college,
        degree: studentA.profile.degree,
        department: studentA.profile.department,
        graduationYear: studentA.profile.graduationYear,
        careerInterests: {
          targetRoles: studentA.profile.targetRoles,
          careerGoals: studentA.profile.careerGoals,
        },
      });

    // Add a skill to Profile A
    await request(app)
      .post('/api/profile/skills')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({
        name: 'TypeScript',
        category: 'languages',
        proficiency: 'Advanced',
      });

    // Add a project to Profile A
    await request(app)
      .post('/api/profile/projects')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({
        title: 'Distributed Cloud Cache',
        technologies: ['TypeScript', 'Redis', 'Docker'],
        bullets: ['Worked on distributed caching layers across clusters'],
      });

    // Register Student B
    const regResB = await request(app).post('/api/auth/register').send({
      name: studentB.name,
      email: studentB.email,
      password: studentB.password,
      role: 'student',
    });
    tokenUserB = regResB.body.data.token;
  });

  afterAll(async () => {
    await User.deleteMany({ email: /@resumetest\.com$/ });
    await StudentProfile.deleteMany({ email: /@resumetest\.com$/ });
    await ResumeDocument.deleteMany({});
    await ResumeAnalysis.deleteMany({});
    await m.disconnect();
  });

  // 1. Text & Header Extraction Security Tests
  describe('Document Security and Text Extraction Utilities', () => {
    it('detects valid PDF magic bytes (%PDF-)', () => {
      const pdfHeader = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x35]);
      expect(validateFileSignature(pdfHeader, 'application/pdf', 'my_resume.pdf')).toBe('pdf');
    });

    it('rejects spoofed file with fake extension and invalid header', () => {
      const fakeHeader = Buffer.from('NOT A REAL PDF CONTENT');
      expect(() =>
        validateFileSignature(fakeHeader, 'application/pdf', 'spoofed.pdf')
      ).toThrow();
    });

    it('sanitizes extracted text by removing control characters and normalizing spaces', () => {
      const raw = 'John Doe\x00\x08   Software\n\n\n\nEngineer    -- 1 of 1 --';
      const clean = sanitizeExtractedText(raw);
      expect(clean).toContain('John Doe');
      expect(clean).toContain('Software');
      expect(clean).not.toContain('\x00');
      expect(clean).not.toContain('-- 1 of 1 --');
    });
  });

  // 2. Resume Builder Creation & Import
  describe('Resume Builder CRUD and Profile Import', () => {
    it('imports profile data into a structured draft resume', async () => {
      const res = await request(app)
        .post('/api/resumes/import-profile')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          templateId: 'technical-classic',
          targetRole: 'Full-Stack Developer',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toContain('Full-Stack Developer');
      expect(res.body.data.templateId).toBe('technical-classic');
      expect(res.body.data.personalInfo.fullName).toBe(studentA.name);
      expect(res.body.data.skills.length).toBeGreaterThan(0);
      expect(res.body.data.projects.length).toBeGreaterThan(0);

      resumeIdUserA = res.body.data._id;
    });

    it('retrieves user resumes and single resume by ID', async () => {
      const listRes = await request(app)
        .get('/api/resumes')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(listRes.status).toBe(200);
      expect(Array.isArray(listRes.body.data)).toBe(true);
      expect(listRes.body.data.length).toBe(1);

      const singleRes = await request(app)
        .get(`/api/resumes/${resumeIdUserA}`)
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(singleRes.status).toBe(200);
      expect(singleRes.body.data._id).toBe(resumeIdUserA);
    });

    it('updates resume details, reorders sections, and adds experience', async () => {
      const updatePayload = {
        title: 'Aarav Sharma - Senior Full-Stack Resume',
        templateId: 'modern-clean',
        sectionOrder: ['personal', 'summary', 'skills', 'experience', 'projects', 'education'],
        experience: [
          {
            role: 'Software Engineering Intern',
            company: 'TechCorp Cloud',
            location: 'San Francisco, CA',
            startDate: 'May 2024',
            endDate: 'August 2024',
            current: false,
            bullets: [
              'Engineered React components improving page render times by 30%',
              'Optimized PostgreSQL queries reducing latency by 45%',
            ],
          },
        ],
      };

      const res = await request(app)
        .put(`/api/resumes/${resumeIdUserA}`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send(updatePayload);

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe(updatePayload.title);
      expect(res.body.data.experience.length).toBe(1);
      expect(res.body.data.sectionOrder[2]).toBe('skills');
    });

    it('creates a new version snapshot of the resume', async () => {
      const res = await request(app)
        .post(`/api/resumes/${resumeIdUserA}/versions`)
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(201);
      expect(res.body.data.version).toBe(2);
      expect(res.body.data.parentResumeId).toBe(resumeIdUserA);
    });

    it('creates a job-specific tailored variant', async () => {
      const res = await request(app)
        .post(`/api/resumes/${resumeIdUserA}/variants`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          targetRole: 'DevOps & Cloud Engineer',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.targetRole).toBe('DevOps & Cloud Engineer');
    });
  });

  // 3. PDF Export
  describe('Resume PDF Export', () => {
    it('exports resume as a valid binary PDF document stream', async () => {
      const res = await request(app)
        .get(`/api/resumes/${resumeIdUserA}/export/pdf`)
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.headers['content-disposition']).toContain('attachment');
      expect(res.body).toBeDefined();
      expect(res.body.length).toBeGreaterThan(500);

      // Verify PDF magic header
      const header = res.body.slice(0, 4).toString('ascii');
      expect(header).toBe('%PDF');
    });

    it('rejects PDF export when required fields are missing', async () => {
      // Create resume without education or skills
      const blankRes = await request(app)
        .post('/api/resumes')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          title: 'Incomplete Draft',
          personalInfo: {
            fullName: 'Aarav Incomplete',
            email: 'aarav.incomplete@resumetest.com',
          },
          education: [],
          skills: [],
        });

      expect(blankRes.status).toBe(201);
      const invalidId = blankRes.body.data._id;

      const exportRes = await request(app)
        .get(`/api/resumes/${invalidId}/export/pdf`)
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(exportRes.status).toBe(400);
      expect(exportRes.body.message).toContain('at least one Education entry or Technical Skill');
    });
  });

  // 4. ATS Resume Analyzer
  describe('Resume ATS Analyzer & Grounded Recommendations', () => {
    it('analyzes an existing resume document against target job requirements', async () => {
      const targetJobDescription = `
        We are seeking a Full-Stack Software Engineer with experience in React, TypeScript, Node.js,
        Docker, PostgreSQL, and AWS. The engineer will design scalable microservices and optimize
        high-throughput database transactions.
      `;

      const res = await request(app)
        .post('/api/resumes/analyze')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          resumeId: resumeIdUserA,
          targetJobTitle: 'Full-Stack Software Engineer',
          targetJobDescription,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const analysis = res.body.data;
      expect(analysis.scores).toBeDefined();
      expect(analysis.scores.overallScore).toBeGreaterThanOrEqual(0);
      expect(analysis.scores.overallScore).toBeLessThanOrEqual(100);
      expect(analysis.scores.keywordMatchScore).toBeGreaterThan(0);
      expect(analysis.scores.impactScore).toBeGreaterThan(0);

      // Keywords
      expect(analysis.matchedKeywords).toBeInstanceOf(Array);
      expect(analysis.missingKeywords).toBeInstanceOf(Array);

      // Section Feedback & Audit
      expect(analysis.sectionFeedback.length).toBeGreaterThan(0);
      expect(analysis.sectionFeedback.some((s: { section: string }) => s.section.includes('Contact'))).toBe(true);

      // Grounded Bullet Suggestions
      expect(analysis.bulletImprovements).toBeInstanceOf(Array);

      // ATS Non-Guarantee Disclaimer
      expect(analysis.atsDisclaimer).toContain('does not guarantee');
    });

    it('analyzes an uploaded PDF resume file via multipart form-data', async () => {
      const samplePdfText = `
        Aarav Sharma
        aarav.sharma@gmail.com | (555) 234-5678 | San Francisco, CA | github.com/aarav
        
        Professional Summary
        Dedicated Software Engineer with 2+ years experience in React, Node.js, TypeScript, and MongoDB.
        
        Technical Skills
        Languages: JavaScript, TypeScript, Python, SQL
        Frameworks: React, Express.js, Tailwind CSS
        Tools & Databases: MongoDB, Git, Docker, Jest
        
        Experience
        Frontend Developer Intern - CloudScale Inc (2024)
        - Engineered customer analytics dashboard with React and TypeScript, boosting engagement by 22%
        - Worked on fixing bugs and UI components
        
        Education
        B.S. in Computer Science - Georgia Tech (2022 - 2026) GPA: 3.8
      `;

      const pdfBuffer = await createTestPdfBuffer(samplePdfText);

      const targetJobDescription = `
        Seeking a Full-Stack Engineer skilled in React, TypeScript, Node.js, Docker, and AWS.
        Must have strong database and frontend testing experience with Jest.
      `;

      const res = await request(app)
        .post('/api/resumes/analyze')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .attach('file', pdfBuffer, 'my_student_resume.pdf')
        .field('targetJobTitle', 'Full-Stack Developer')
        .field('targetJobDescription', targetJobDescription);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.scores.overallScore).toBeGreaterThan(60);
      expect(res.body.data.matchedKeywords).toContain('TypeScript');
      expect(res.body.data.matchedKeywords).toContain('React');
    });

    it('rejects analysis when job description is missing or too brief', async () => {
      const res = await request(app)
        .post('/api/resumes/analyze')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          resumeId: resumeIdUserA,
          targetJobDescription: 'too short',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Target job description must be provided');
    });

    it('applies an accepted bullet improvement into the student resume', async () => {
      const original = 'Worked on distributed caching layers across clusters';
      const suggested =
        'Architected and deployed distributed caching layers across Redis clusters, reducing query response times by 35%';

      const res = await request(app)
        .post(`/api/resumes/${resumeIdUserA}/apply-bullet`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ original, suggested });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify bullet was updated in project
      const updatedResume = res.body.data;
      const projectBullets = updatedResume.projects.flatMap((p: { bullets: string[] }) => p.bullets);
      expect(projectBullets).toContain(suggested);
    });

    it('retrieves user analysis history', async () => {
      const res = await request(app)
        .get('/api/resumes/analyses')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  // 5. Cross-User Security & Authorization
  describe('Multi-Tenant Cross-User Isolation', () => {
    it('prevents Student B from accessing Student A resume', async () => {
      const res = await request(app)
        .get(`/api/resumes/${resumeIdUserA}`)
        .set('Authorization', `Bearer ${tokenUserB}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('not authorized');
    });

    it('prevents Student B from updating Student A resume', async () => {
      const res = await request(app)
        .put(`/api/resumes/${resumeIdUserA}`)
        .set('Authorization', `Bearer ${tokenUserB}`)
        .send({ title: 'Hacked Title' });

      expect(res.status).toBe(403);
    });

    it('prevents Student B from deleting Student A resume', async () => {
      const res = await request(app)
        .delete(`/api/resumes/${resumeIdUserA}`)
        .set('Authorization', `Bearer ${tokenUserB}`);

      expect(res.status).toBe(403);
    });

    it('prevents Student B from exporting Student A resume as PDF', async () => {
      const res = await request(app)
        .get(`/api/resumes/${resumeIdUserA}/export/pdf`)
        .set('Authorization', `Bearer ${tokenUserB}`);

      expect(res.status).toBe(403);
    });
  });
});
