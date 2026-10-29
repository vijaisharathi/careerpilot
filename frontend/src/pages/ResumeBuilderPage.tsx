import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Printer,
  Download,
  Copy,
  Plus,
  Trash2,
  Sparkles,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Eye,
  Layers,
  FileCheck2,
  Bookmark,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Input, Textarea } from '../components/common/FormControls';
import { useToast } from '../context/ToastContext';
import { resumeService } from '../services/resume.service';
import {
  IResumeDocument,
  ResumeTemplateId,
  IResumeExperience,
  IResumeProject,
  IResumeEducation,
  IResumeSkill,
  IResumeCertification,
} from '../types/resume.types';

const TEMPLATES: Array<{ id: ResumeTemplateId; name: string; tag: string; description: string }> = [
  {
    id: 'modern-clean',
    name: 'Modern Clean',
    tag: 'Recommended',
    description: 'Sleek single-column design with contemporary typography and subtle accent dividers.',
  },
  {
    id: 'technical-classic',
    name: 'Technical Classic',
    tag: 'Highest ATS Match',
    description: 'Dense, recruiter-favored engineering layout putting technical competencies front and center.',
  },
  {
    id: 'minimalist-executive',
    name: 'Minimalist Executive',
    tag: 'Clean & Spacious',
    description: 'Understated elegance, refined margins, and prominent professional branding.',
  },
  {
    id: 'academic-research',
    name: 'Academic & Research',
    tag: 'Detailed Portfolio',
    description: 'Structured layout emphasizing education, honors, project architectures, and credentials.',
  },
];

const DEFAULT_SECTIONS = [
  'summary',
  'skills',
  'experience',
  'projects',
  'education',
  'certifications',
];

export const ResumeBuilderPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error, info } = useToast();

  const [resumes, setResumes] = useState<IResumeDocument[]>([]);
  const [currentResume, setCurrentResume] = useState<IResumeDocument | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [exporting, setExporting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [variantRole, setVariantRole] = useState<string>('');
  const [showVariantModal, setShowVariantModal] = useState<boolean>(false);

  // Load resumes from backend
  const loadResumes = useCallback(async () => {
    try {
      setLoading(true);
      const list = await resumeService.getResumes();
      setResumes(list);
      if (list.length > 0) {
        setCurrentResume(list[0]);
      } else {
        // If no resume exists yet, auto-populate initial from profile
        try {
          const imported = await resumeService.populateFromProfile('modern-clean');
          setResumes([imported]);
          setCurrentResume(imported);
          info('Profile Imported', 'Pre-filled your initial resume draft from your student profile.');
        } catch {
          // Fallback to blank resume if profile import fails
          const blank = await resumeService.createResume({
            title: 'My Engineering Resume',
            templateId: 'modern-clean',
            personalInfo: {
              fullName: 'Student Candidate',
              email: 'candidate@university.edu',
            },
          });
          setResumes([blank]);
          setCurrentResume(blank);
        }
      }
    } catch (err) {
      error('Failed to load resumes', (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [error, info]);

  useEffect(() => {
    loadResumes();
  }, [loadResumes]);

  // Handle Save Draft to MongoDB
  const handleSaveResume = async () => {
    if (!currentResume) return;
    try {
      setSaving(true);
      const updated = await resumeService.updateResume(currentResume._id, {
        title: currentResume.title,
        targetRole: currentResume.targetRole,
        templateId: currentResume.templateId,
        sectionOrder: currentResume.sectionOrder,
        personalInfo: currentResume.personalInfo,
        education: currentResume.education,
        experience: currentResume.experience,
        projects: currentResume.projects,
        skills: currentResume.skills,
        certifications: currentResume.certifications,
      });

      setCurrentResume(updated);
      setResumes((prev) => prev.map((r) => (r._id === updated._id ? updated : r)));
      success('Resume Saved', 'All resume changes have been persisted to cloud database.');
    } catch (err) {
      error('Failed to save resume', (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  // Import directly from Student Profile
  const handleImportProfile = async () => {
    try {
      setLoading(true);
      const imported = await resumeService.populateFromProfile(
        currentResume?.templateId || 'modern-clean',
        currentResume?.targetRole
      );
      setResumes((prev) => [imported, ...prev]);
      setCurrentResume(imported);
      success('Imported From Profile', 'Created a fresh resume draft pre-filled with your saved profile data.');
    } catch (err) {
      error('Import failed', (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Create Snapshot Version
  const handleCreateVersion = async () => {
    if (!currentResume) return;
    try {
      setSaving(true);
      const versionDoc = await resumeService.createVersion(currentResume._id);
      setResumes((prev) => [versionDoc, ...prev]);
      setCurrentResume(versionDoc);
      success('Version Created', `Saved version v${versionDoc.version} snapshot successfully.`);
    } catch (err) {
      error('Failed to create version', (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  // Create Job Variant
  const handleCreateVariant = async () => {
    if (!currentResume || !variantRole.trim()) return;
    try {
      setSaving(true);
      const variant = await resumeService.createVariant(currentResume._id, variantRole.trim());
      setResumes((prev) => [variant, ...prev]);
      setCurrentResume(variant);
      setShowVariantModal(false);
      setVariantRole('');
      success('Variant Created', `Created tailored variant targeting ${variant.targetRole}.`);
    } catch (err) {
      error('Failed to create variant', (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  // Export PDF
  const handleExportPdf = async () => {
    if (!currentResume) return;

    // Validate required fields client-side before call
    if (!currentResume.personalInfo.fullName?.trim()) {
      error('Validation Error', 'Full Name is required for PDF export.');
      return;
    }
    if (!currentResume.personalInfo.email?.trim()) {
      error('Validation Error', 'Email Address is required for PDF export.');
      return;
    }
    if (
      (!currentResume.education || currentResume.education.length === 0) &&
      (!currentResume.skills || currentResume.skills.length === 0)
    ) {
      error('Validation Error', 'Please include at least one Education entry or Technical Skill.');
      return;
    }

    try {
      setExporting(true);
      const filename = `${currentResume.personalInfo.fullName.replace(/\s+/g, '_')}_Resume.pdf`;
      await resumeService.exportPdf(currentResume._id, filename);
      success('PDF Export Complete', 'Clean, ATS-standard PDF resume downloaded successfully.');
    } catch (err) {
      error('PDF Export Failed', (err as Error).message);
    } finally {
      setExporting(false);
    }
  };

  // Copy Markdown
  const handleCopyMarkdown = () => {
    if (!currentResume) return;
    const { personalInfo, experience, projects, skills, education } = currentResume;
    const md = `# ${personalInfo.fullName}
${[personalInfo.email, personalInfo.phone, personalInfo.location].filter(Boolean).join(' | ')}
${[personalInfo.linkedin, personalInfo.github, personalInfo.portfolio].filter(Boolean).join(' | ')}

## Summary
${personalInfo.summary || ''}

## Skills
${skills.map((s) => s.name).join(', ')}

## Experience
${experience.map((e) => `### ${e.role} — ${e.company} (${e.startDate} - ${e.current ? 'Present' : e.endDate})\n${e.bullets.map((b) => `- ${b}`).join('\n')}`).join('\n\n')}

## Projects
${projects.map((p) => `### ${p.title} (${p.technologies.join(', ')})\n${p.bullets.map((b) => `- ${b}`).join('\n')}`).join('\n\n')}

## Education
${education.map((ed) => `### ${ed.degree} in ${ed.field} — ${ed.institution} (${ed.startDate} - ${ed.endDate}) GPA: ${ed.gpa || 'N/A'}`).join('\n')}
`;
    navigator.clipboard.writeText(md);
    info('Markdown Copied', 'Resume text copied to clipboard in standard Markdown.');
  };

  // Section Reordering Helpers
  const moveSection = (index: number, direction: 'up' | 'down') => {
    if (!currentResume) return;
    const order = [...(currentResume.sectionOrder || DEFAULT_SECTIONS)];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= order.length) return;

    const temp = order[index];
    order[index] = order[targetIndex];
    order[targetIndex] = temp;

    setCurrentResume({
      ...currentResume,
      sectionOrder: order,
    });
  };

  // Item Addition Helpers
  const addExperienceItem = () => {
    if (!currentResume) return;
    const newItem: IResumeExperience = {
      role: 'Software Engineer Intern',
      company: 'Tech Organization',
      location: 'Remote',
      startDate: 'Jun 2024',
      endDate: 'Aug 2024',
      current: false,
      bullets: ['Engineered scalable features using React and TypeScript'],
    };
    setCurrentResume({
      ...currentResume,
      experience: [newItem, ...currentResume.experience],
    });
  };

  const addProjectItem = () => {
    if (!currentResume) return;
    const newItem: IResumeProject = {
      title: 'Full-Stack Web Platform',
      technologies: ['React', 'Node.js', 'MongoDB'],
      link: 'github.com/myproject',
      bullets: ['Implemented end-to-end authentication and responsive dashboard'],
    };
    setCurrentResume({
      ...currentResume,
      projects: [newItem, ...currentResume.projects],
    });
  };

  const addEducationItem = () => {
    if (!currentResume) return;
    const newItem: IResumeEducation = {
      institution: 'State University',
      degree: 'Bachelor of Science',
      field: 'Computer Science',
      startDate: '2022',
      endDate: '2026',
      gpa: '3.8',
    };
    setCurrentResume({
      ...currentResume,
      education: [...currentResume.education, newItem],
    });
  };

  const addSkillItem = (category: IResumeSkill['category'] = 'languages') => {
    if (!currentResume) return;
    const newItem: IResumeSkill = {
      name: 'New Skill',
      category,
      proficiency: 'Intermediate',
    };
    setCurrentResume({
      ...currentResume,
      skills: [...currentResume.skills, newItem],
    });
  };

  if (loading && !currentResume) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-sm font-medium text-slate-600">Loading your resumes and ATS workspace...</p>
      </div>
    );
  }

  if (!currentResume) return null;

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      {/* Top Banner & Control Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Professional Resume Builder
            </h1>
            <Badge variant="success" size="sm">
              v{currentResume.version} {currentResume.isCurrentDraft ? 'Active Draft' : 'Snapshot'}
            </Badge>
            <Badge variant="neutral" size="sm">
              {TEMPLATES.find((t) => t.id === currentResume.templateId)?.name || 'Modern Clean'}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Build ATS-optimized, single-column resumes with quantified bullet formulas and instant live preview.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Resume Switcher Dropdown */}
          {resumes.length > 1 && (
            <select
              value={currentResume._id}
              onChange={(e) => {
                const found = resumes.find((r) => r._id === e.target.value);
                if (found) setCurrentResume(found);
              }}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {resumes.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.title} (v{r.version})
                </option>
              ))}
            </select>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={handleImportProfile}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            Import Profile
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowVariantModal(true)}
            leftIcon={<Layers className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            Job Variant
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleCopyMarkdown}
            leftIcon={<Copy className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            Markdown
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => window.print()}
            leftIcon={<Printer className="w-3.5 h-3.5" />}
            className="text-xs hidden sm:inline-flex"
          >
            Print
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleExportPdf}
            isLoading={exporting}
            leftIcon={<Download className="w-3.5 h-3.5" />}
            className="text-xs text-indigo-700 border-indigo-200 hover:bg-indigo-50"
          >
            Download PDF
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={handleSaveResume}
            isLoading={saving}
            leftIcon={<Bookmark className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            Save Draft
          </Button>
        </div>
      </div>

      {/* Template Selection Pills */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <span className="text-xs font-semibold text-slate-600 block mb-2 uppercase tracking-wider">
          Select Resume Template Architecture
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {TEMPLATES.map((tmpl) => (
            <div
              key={tmpl.id}
              onClick={() => setCurrentResume({ ...currentResume, templateId: tmpl.id })}
              className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                currentResume.templateId === tmpl.id
                  ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-900">{tmpl.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                    currentResume.templateId === tmpl.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tmpl.tag}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                {tmpl.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Two-Column Builder Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (Forms & Reorder) - 7 cols */}
        <div className="lg:col-span-7 space-y-6">
          {/* Resume Title & Target Role */}
          <Card className="shadow-2xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Document Meta & Goal</CardTitle>
              <CardDescription>Label your resume variant and target specialization.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0">
              <Input
                label="Resume Title"
                value={currentResume.title}
                onChange={(e) => setCurrentResume({ ...currentResume, title: e.target.value })}
                placeholder="e.g. Senior Full-Stack Engineer Resume"
              />
              <Input
                label="Target Role / Headline"
                value={currentResume.targetRole || ''}
                onChange={(e) => setCurrentResume({ ...currentResume, targetRole: e.target.value })}
                placeholder="e.g. Full-Stack Developer"
              />
            </CardContent>
          </Card>

          {/* Section 1: Contact Information */}
          <Card className="shadow-2xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">1. Contact & Header Information</CardTitle>
              <CardDescription>Parsed directly by recruiter ATS indexers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Full Name *"
                  value={currentResume.personalInfo.fullName}
                  onChange={(e) =>
                    setCurrentResume({
                      ...currentResume,
                      personalInfo: { ...currentResume.personalInfo, fullName: e.target.value },
                    })
                  }
                />
                <Input
                  label="Email Address *"
                  value={currentResume.personalInfo.email}
                  onChange={(e) =>
                    setCurrentResume({
                      ...currentResume,
                      personalInfo: { ...currentResume.personalInfo, email: e.target.value },
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Phone Number"
                  value={currentResume.personalInfo.phone || ''}
                  onChange={(e) =>
                    setCurrentResume({
                      ...currentResume,
                      personalInfo: { ...currentResume.personalInfo, phone: e.target.value },
                    })
                  }
                />
                <Input
                  label="Location"
                  value={currentResume.personalInfo.location || ''}
                  onChange={(e) =>
                    setCurrentResume({
                      ...currentResume,
                      personalInfo: { ...currentResume.personalInfo, location: e.target.value },
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  label="LinkedIn URL"
                  value={currentResume.personalInfo.linkedin || ''}
                  onChange={(e) =>
                    setCurrentResume({
                      ...currentResume,
                      personalInfo: { ...currentResume.personalInfo, linkedin: e.target.value },
                    })
                  }
                  placeholder="linkedin.com/in/username"
                />
                <Input
                  label="GitHub URL"
                  value={currentResume.personalInfo.github || ''}
                  onChange={(e) =>
                    setCurrentResume({
                      ...currentResume,
                      personalInfo: { ...currentResume.personalInfo, github: e.target.value },
                    })
                  }
                  placeholder="github.com/username"
                />
                <Input
                  label="Portfolio / Website"
                  value={currentResume.personalInfo.portfolio || ''}
                  onChange={(e) =>
                    setCurrentResume({
                      ...currentResume,
                      personalInfo: { ...currentResume.personalInfo, portfolio: e.target.value },
                    })
                  }
                  placeholder="mywebsite.dev"
                />
              </div>

              <Textarea
                label="Executive Summary (2-3 sentences)"
                rows={3}
                value={currentResume.personalInfo.summary || ''}
                onChange={(e) =>
                  setCurrentResume({
                    ...currentResume,
                    personalInfo: { ...currentResume.personalInfo, summary: e.target.value },
                  })
                }
                helperText="Summarize your technical foundation, major accomplishments, and the immediate value you bring to engineering teams."
              />
            </CardContent>
          </Card>

          {/* Section 2: Technical Skills */}
          <Card className="shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">2. Technical Skills Matrix</CardTitle>
                <CardDescription>Categorized skills for maximum ATS keyword density.</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={() => addSkillItem()} leftIcon={<Plus className="w-3 h-3" />}>
                Add Skill
              </Button>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {currentResume.skills.map((skill, idx) => (
                  <div
                    key={skill._id || idx}
                    className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50/50"
                  >
                    <input
                      type="text"
                      value={skill.name}
                      onChange={(e) => {
                        const updated = [...currentResume.skills];
                        updated[idx].name = e.target.value;
                        setCurrentResume({ ...currentResume, skills: updated });
                      }}
                      className="text-xs bg-transparent border-none flex-1 font-semibold text-slate-800 focus:outline-none"
                    />
                    <select
                      value={skill.category}
                      onChange={(e) => {
                        const updated = [...currentResume.skills];
                        updated[idx].category = e.target.value as IResumeSkill['category'];
                        setCurrentResume({ ...currentResume, skills: updated });
                      }}
                      className="text-[11px] bg-white border border-slate-200 rounded px-1.5 py-0.5 text-slate-600"
                    >
                      <option value="languages">Languages</option>
                      <option value="frameworks">Frameworks</option>
                      <option value="databases">Databases</option>
                      <option value="cloud">Cloud/DevOps</option>
                      <option value="tools">Tools</option>
                      <option value="soft_skills">Soft Skills</option>
                    </select>
                    <button
                      onClick={() => {
                        const updated = currentResume.skills.filter((_, i) => i !== idx);
                        setCurrentResume({ ...currentResume, skills: updated });
                      }}
                      className="text-slate-400 hover:text-red-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Experience & Internships */}
          <Card className="shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">3. Work Experience & Internships</CardTitle>
                <CardDescription>Quantified accomplishments using action verbs.</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={addExperienceItem} leftIcon={<Plus className="w-3 h-3" />}>
                Add Role
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              {currentResume.experience.map((exp, idx) => (
                <div key={exp._id || idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Experience #{idx + 1}</span>
                    <button
                      onClick={() => {
                        const updated = currentResume.experience.filter((_, i) => i !== idx);
                        setCurrentResume({ ...currentResume, experience: updated });
                      }}
                      className="text-slate-400 hover:text-red-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="Job Role / Title"
                      value={exp.role}
                      onChange={(e) => {
                        const updated = [...currentResume.experience];
                        updated[idx].role = e.target.value;
                        setCurrentResume({ ...currentResume, experience: updated });
                      }}
                    />
                    <Input
                      label="Company / Organization"
                      value={exp.company}
                      onChange={(e) => {
                        const updated = [...currentResume.experience];
                        updated[idx].company = e.target.value;
                        setCurrentResume({ ...currentResume, experience: updated });
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Input
                      label="Location"
                      value={exp.location || ''}
                      onChange={(e) => {
                        const updated = [...currentResume.experience];
                        updated[idx].location = e.target.value;
                        setCurrentResume({ ...currentResume, experience: updated });
                      }}
                    />
                    <Input
                      label="Start Date"
                      value={exp.startDate}
                      onChange={(e) => {
                        const updated = [...currentResume.experience];
                        updated[idx].startDate = e.target.value;
                        setCurrentResume({ ...currentResume, experience: updated });
                      }}
                    />
                    <Input
                      label="End Date"
                      value={exp.endDate}
                      onChange={(e) => {
                        const updated = [...currentResume.experience];
                        updated[idx].endDate = e.target.value;
                        setCurrentResume({ ...currentResume, experience: updated });
                      }}
                    />
                  </div>

                  <Textarea
                    label="Accomplishment Bullets (One per line)"
                    rows={3}
                    value={exp.bullets.join('\n')}
                    onChange={(e) => {
                      const updated = [...currentResume.experience];
                      updated[idx].bullets = e.target.value.split('\n');
                      setCurrentResume({ ...currentResume, experience: updated });
                    }}
                    helperText="Follow formula: Strong Action Verb + Technical Scope + Quantified Result (e.g. 'Engineered REST endpoints in Node.js, reducing query response times by 30%')."
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Section 4: Projects */}
          <Card className="shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">4. Engineering Projects</CardTitle>
                <CardDescription>Practical implementations with architecture specifics.</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={addProjectItem} leftIcon={<Plus className="w-3 h-3" />}>
                Add Project
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              {currentResume.projects.map((proj, idx) => (
                <div key={proj._id || idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Project #{idx + 1}</span>
                    <button
                      onClick={() => {
                        const updated = currentResume.projects.filter((_, i) => i !== idx);
                        setCurrentResume({ ...currentResume, projects: updated });
                      }}
                      className="text-slate-400 hover:text-red-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="Project Title"
                      value={proj.title}
                      onChange={(e) => {
                        const updated = [...currentResume.projects];
                        updated[idx].title = e.target.value;
                        setCurrentResume({ ...currentResume, projects: updated });
                      }}
                    />
                    <Input
                      label="Live Link / GitHub"
                      value={proj.link || ''}
                      onChange={(e) => {
                        const updated = [...currentResume.projects];
                        updated[idx].link = e.target.value;
                        setCurrentResume({ ...currentResume, projects: updated });
                      }}
                      placeholder="github.com/org/repo"
                    />
                  </div>

                  <Input
                    label="Technologies Used (Comma-separated)"
                    value={proj.technologies.join(', ')}
                    onChange={(e) => {
                      const updated = [...currentResume.projects];
                      updated[idx].technologies = e.target.value.split(',').map((s) => s.trim());
                      setCurrentResume({ ...currentResume, projects: updated });
                    }}
                  />

                  <Textarea
                    label="Project Impact Bullets (One per line)"
                    rows={2}
                    value={proj.bullets.join('\n')}
                    onChange={(e) => {
                      const updated = [...currentResume.projects];
                      updated[idx].bullets = e.target.value.split('\n');
                      setCurrentResume({ ...currentResume, projects: updated });
                    }}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Section 5: Education */}
          <Card className="shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">5. Education & Academics</CardTitle>
                <CardDescription>Academic credentials, GPA, and graduation timeline.</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={addEducationItem} leftIcon={<Plus className="w-3 h-3" />}>
                Add Degree
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              {currentResume.education.map((edu, idx) => (
                <div key={edu._id || idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Academic Entry #{idx + 1}</span>
                    <button
                      onClick={() => {
                        const updated = currentResume.education.filter((_, i) => i !== idx);
                        setCurrentResume({ ...currentResume, education: updated });
                      }}
                      className="text-slate-400 hover:text-red-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="Institution / University"
                      value={edu.institution}
                      onChange={(e) => {
                        const updated = [...currentResume.education];
                        updated[idx].institution = e.target.value;
                        setCurrentResume({ ...currentResume, education: updated });
                      }}
                    />
                    <Input
                      label="Degree & Field"
                      value={`${edu.degree}${edu.field ? ' in ' + edu.field : ''}`}
                      onChange={(e) => {
                        const updated = [...currentResume.education];
                        const parts = e.target.value.split(' in ');
                        updated[idx].degree = parts[0] || 'Bachelor of Science';
                        updated[idx].field = parts[1] || 'Computer Science';
                        setCurrentResume({ ...currentResume, education: updated });
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Input
                      label="Start Year"
                      value={edu.startDate}
                      onChange={(e) => {
                        const updated = [...currentResume.education];
                        updated[idx].startDate = e.target.value;
                        setCurrentResume({ ...currentResume, education: updated });
                      }}
                    />
                    <Input
                      label="Graduation Year"
                      value={edu.endDate}
                      onChange={(e) => {
                        const updated = [...currentResume.education];
                        updated[idx].endDate = e.target.value;
                        setCurrentResume({ ...currentResume, education: updated });
                      }}
                    />
                    <Input
                      label="GPA / Honors"
                      value={edu.gpa || ''}
                      onChange={(e) => {
                        const updated = [...currentResume.education];
                        updated[idx].gpa = e.target.value;
                        setCurrentResume({ ...currentResume, education: updated });
                      }}
                      placeholder="e.g. 3.8 / 4.0"
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Section Order Manager */}
          <Card className="shadow-2xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Section Sequence & Layout Order</CardTitle>
              <CardDescription>Reorder sections to customize prominence for specific roles.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {(currentResume.sectionOrder || DEFAULT_SECTIONS).map((sec, idx) => (
                <div
                  key={sec}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-white"
                >
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                    {idx + 1}. {sec}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      disabled={idx === 0}
                      onClick={() => moveSection(idx, 'up')}
                      className="p-1 rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      disabled={idx === (currentResume.sectionOrder || DEFAULT_SECTIONS).length - 1}
                      onClick={() => moveSection(idx, 'down')}
                      className="p-1 rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Live ATS Preview Pane - 5 cols */}
        <div className="lg:col-span-5 sticky top-20 space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 px-1">
            <span className="flex items-center gap-1.5 font-bold">
              <Eye className="w-4 h-4 text-indigo-600" />
              Live Visual Preview
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  navigate('/resume-analysis', {
                    state: { selectedResumeId: currentResume._id },
                  })
                }
                leftIcon={<Sparkles className="w-3 h-3 text-indigo-600" />}
                className="text-[11px]"
              >
                Analyze ATS Fit
              </Button>
            </div>
          </div>

          {/* Render Preview according to selected template styling */}
          <div
            className={`p-7 rounded-2xl bg-white border shadow-sm text-slate-900 font-sans text-xs space-y-3.5 max-h-[85vh] overflow-y-auto ${
              currentResume.templateId === 'technical-classic'
                ? 'border-slate-300 font-mono text-[11px]'
                : currentResume.templateId === 'minimalist-executive'
                ? 'border-zinc-200'
                : currentResume.templateId === 'academic-research'
                ? 'border-indigo-100'
                : 'border-slate-200'
            }`}
          >
            {/* Header */}
            <div
              className={`pb-3 border-b space-y-1 ${
                currentResume.templateId === 'technical-classic'
                  ? 'text-left border-slate-300'
                  : 'text-center border-slate-200'
              }`}
            >
              <h1
                className={`text-base sm:text-lg font-bold tracking-tight text-slate-900 uppercase ${
                  currentResume.templateId === 'minimalist-executive' ? 'tracking-widest' : ''
                }`}
              >
                {currentResume.personalInfo.fullName || 'CANDIDATE NAME'}
              </h1>

              {(currentResume.personalInfo.headline || currentResume.targetRole) && (
                <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                  {currentResume.personalInfo.headline || currentResume.targetRole}
                </p>
              )}

              <div className="text-[10.5px] text-slate-600 flex flex-wrap items-center justify-center gap-1.5">
                {currentResume.personalInfo.email && <span>{currentResume.personalInfo.email}</span>}
                {currentResume.personalInfo.phone && <span>• {currentResume.personalInfo.phone}</span>}
                {currentResume.personalInfo.location && <span>• {currentResume.personalInfo.location}</span>}
                {currentResume.personalInfo.linkedin && (
                  <span className="text-indigo-600">• {currentResume.personalInfo.linkedin}</span>
                )}
                {currentResume.personalInfo.github && (
                  <span className="text-indigo-600">• {currentResume.personalInfo.github}</span>
                )}
              </div>
            </div>

            {/* Dynamic Sections rendering in custom order */}
            {(currentResume.sectionOrder || DEFAULT_SECTIONS).map((sectionKey) => {
              if (sectionKey === 'summary' && currentResume.personalInfo.summary) {
                return (
                  <div key="summary" className="space-y-1">
                    <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-0.5">
                      Professional Summary
                    </h2>
                    <p className="text-[11px] text-slate-700 leading-relaxed">
                      {currentResume.personalInfo.summary}
                    </p>
                  </div>
                );
              }

              if (sectionKey === 'skills' && currentResume.skills.length > 0) {
                return (
                  <div key="skills" className="space-y-1">
                    <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-0.5">
                      Technical Skills
                    </h2>
                    <div className="text-[10.5px] text-slate-700 space-y-0.5">
                      <div>
                        <strong>Languages & Frameworks:</strong>{' '}
                        {currentResume.skills
                          .filter((s) => s.category === 'languages' || s.category === 'frameworks')
                          .map((s) => s.name)
                          .join(', ') ||
                          currentResume.skills.map((s) => s.name).join(', ')}
                      </div>
                      {currentResume.skills.some((s) => s.category === 'databases' || s.category === 'cloud') && (
                        <div>
                          <strong>Databases & Cloud:</strong>{' '}
                          {currentResume.skills
                            .filter((s) => s.category === 'databases' || s.category === 'cloud')
                            .map((s) => s.name)
                            .join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              if (sectionKey === 'experience' && currentResume.experience.length > 0) {
                return (
                  <div key="experience" className="space-y-2">
                    <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-0.5">
                      Experience & Internships
                    </h2>
                    {currentResume.experience.map((exp, idx) => (
                      <div key={idx} className="space-y-1 text-[11px]">
                        <div className="flex justify-between font-bold text-slate-900">
                          <span>
                            {exp.role}{' '}
                            <span className="font-normal text-slate-600">
                              | {exp.company}
                              {exp.location ? `, ${exp.location}` : ''}
                            </span>
                          </span>
                          <span className="text-[10px] text-slate-500 font-normal">
                            {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                          </span>
                        </div>
                        <ul className="list-disc pl-4 space-y-0.5 marker:text-slate-400 text-slate-700 text-[10.5px]">
                          {exp.bullets.map((b, bIdx) => (
                            <li key={bIdx}>{b}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                );
              }

              if (sectionKey === 'projects' && currentResume.projects.length > 0) {
                return (
                  <div key="projects" className="space-y-2">
                    <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-0.5">
                      Key Projects
                    </h2>
                    {currentResume.projects.map((proj, idx) => (
                      <div key={idx} className="space-y-0.5 text-[11px]">
                        <div className="flex justify-between font-bold text-slate-900">
                          <span>
                            {proj.title}{' '}
                            {proj.technologies.length > 0 && (
                              <span className="text-[10px] font-normal text-indigo-600">
                                ({proj.technologies.join(', ')})
                              </span>
                            )}
                          </span>
                          {proj.link && (
                            <span className="text-[10px] text-slate-400 font-normal">
                              {proj.link}
                            </span>
                          )}
                        </div>
                        <ul className="list-disc pl-4 space-y-0.5 marker:text-slate-400 text-slate-700 text-[10.5px]">
                          {proj.bullets.map((b, bIdx) => (
                            <li key={bIdx}>{b}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                );
              }

              if (sectionKey === 'education' && currentResume.education.length > 0) {
                return (
                  <div key="education" className="space-y-1">
                    <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-0.5">
                      Education
                    </h2>
                    {currentResume.education.map((edu, idx) => (
                      <div key={idx} className="text-[11px]">
                        <div className="flex justify-between font-bold text-slate-900">
                          <span>
                            {edu.degree} in {edu.field}
                          </span>
                          <span className="text-[10px] text-slate-500 font-normal">
                            {edu.startDate} - {edu.endDate}
                          </span>
                        </div>
                        <div className="text-[10.5px] text-slate-600 flex justify-between">
                          <span>{edu.institution}</span>
                          {edu.gpa && <span>GPA: {edu.gpa}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              }

              return null;
            })}
          </div>
        </div>
      </div>

      {/* Modal: Create Job Variant */}
      {showVariantModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Create Job-Specific Variant</h3>
            <p className="text-xs text-slate-500">
              Clones this resume and tailors the headline and keywords specifically for a target role without affecting your base resume.
            </p>
            <Input
              label="Target Role Specialization"
              value={variantRole}
              onChange={(e) => setVariantRole(e.target.value)}
              placeholder="e.g. Cloud & DevOps Engineer"
              autoFocus
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowVariantModal(false);
                  setVariantRole('');
                }}
              >
                Cancel
              </Button>
              <Button size="sm" variant="primary" onClick={handleCreateVariant} disabled={!variantRole.trim()}>
                Create Tailored Variant
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
