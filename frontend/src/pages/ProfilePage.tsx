import React, { useState } from 'react';
import {
  User,
  GraduationCap,
  Award,
  Plus,
  Trash2,
  CheckCircle2,
  Edit2,
  Globe,
  Code2,
  BookOpen,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Input, Select, Textarea } from '../components/common/FormControls';
import { useStudentData, StudentSkill } from '../context/StudentDataContext';
import { useToast } from '../context/ToastContext';

export const ProfilePage: React.FC = () => {
  const {
    profile,
    updateProfile,
    addSkill,
    removeSkill,
    addCertification,
    removeCertification,
    backendProfile,
  } = useStudentData();
  const { success, error } = useToast();

  // Modals state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isAddSkillOpen, setIsAddSkillOpen] = useState(false);
  const [isAddCertOpen, setIsAddCertOpen] = useState(false);

  // Edit Profile Form
  const [profileForm, setProfileForm] = useState({
    name: profile.name,
    headline: profile.headline,
    bio: profile.bio,
    institution: profile.education.institution,
    degree: profile.education.degree,
    major: profile.education.major,
    graduationYear: profile.education.graduationYear,
    currentYear: profile.education.currentYear,
    gpa: profile.education.gpa,
  });

  // Add Skill Form
  const [skillForm, setSkillForm] = useState<{
    name: string;
    category: StudentSkill['category'];
    level: StudentSkill['level'];
  }>({
    name: '',
    category: 'languages',
    level: 'Intermediate',
  });

  // Add Cert Form
  const [certForm, setCertForm] = useState({
    title: '',
    issuer: '',
    issueDate: '',
  });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: profileForm.name,
      headline: profileForm.headline,
      bio: profileForm.bio,
      education: {
        institution: profileForm.institution,
        degree: profileForm.degree,
        major: profileForm.major,
        graduationYear: Number(profileForm.graduationYear),
        currentYear: profileForm.currentYear,
        gpa: profileForm.gpa,
      },
    });
    setIsEditProfileOpen(false);
    success('Profile Updated', 'Student academic details and bio successfully saved.');
  };

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillForm.name.trim()) {
      error('Skill Name Required', 'Please enter a valid skill title.');
      return;
    }

    addSkill({
      name: skillForm.name.trim(),
      category: skillForm.category,
      level: skillForm.level,
    });
    setSkillForm({ name: '', category: 'languages', level: 'Intermediate' });
    setIsAddSkillOpen(false);
    success('Skill Added', `${skillForm.name} added to your verified competencies.`);
  };

  const handleAddCert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!certForm.title || !certForm.issuer) {
      error('Fields Required', 'Please provide certification title and issuing body.');
      return;
    }

    addCertification({
      title: certForm.title,
      issuer: certForm.issuer,
      issueDate: certForm.issueDate || 'October 2026',
    });
    setCertForm({ title: '', issuer: '', issueDate: '' });
    setIsAddCertOpen(false);
    success('Certificate Added', `${certForm.title} added to your public profile.`);
  };

  // Group skills by category
  const categories: Array<{ id: StudentSkill['category']; label: string }> = [
    { id: 'languages', label: 'Programming Languages' },
    { id: 'frameworks', label: 'Frameworks & Libraries' },
    { id: 'databases', label: 'Databases & Storage' },
    { id: 'cloud', label: 'Cloud, DevOps & Tooling' },
    { id: 'soft_skills', label: 'Interpersonal & Workflow' },
  ];

  return (
    <div className="space-y-8 pb-12 max-w-5xl mx-auto">
      {/* Header Profile Card */}
      <Card className="shadow-sm">
        <CardContent className="pt-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <img
                src={profile.avatar}
                alt={profile.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-indigo-100 shadow-sm"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{profile.name}</h2>
                  <Badge variant="success" size="sm" dot>Verified Student</Badge>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 font-medium">{profile.headline}</p>
                <p className="text-xs text-slate-400">
                  {profile.education.institution} &bull; {profile.location}
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditProfileOpen(true)}
              leftIcon={<Edit2 className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              Edit Profile
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 text-xs text-slate-600">
            <div>
              <span className="text-slate-400 block mb-0.5">Degree & Major</span>
              <strong className="text-slate-800 text-sm">{profile.education.degree}</strong>
              <div className="text-slate-500 mt-0.5">{profile.education.major}</div>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Placement Term</span>
              <strong className="text-slate-800 text-sm">Graduation {profile.education.graduationYear}</strong>
              <div className="text-slate-500 mt-0.5">{profile.education.currentYear}</div>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Cumulative GPA</span>
              <strong className="text-slate-800 text-sm">{profile.education.gpa}</strong>
              <div className="text-emerald-600 font-medium mt-0.5">Top 15% Academic Standing</div>
            </div>
          </div>

          {profile.bio && (
            <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-600 leading-relaxed">
              <strong className="text-slate-800 block mb-1">Executive Summary:</strong>
              {profile.bio}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Target Roles */}
      <Card className="shadow-2xs">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base">Target Placement Roles</CardTitle>
            <CardDescription>Primary engineering tracks for automated matching</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2">
            {profile.targetRoles.map((role, idx) => (
              <span
                key={idx}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold flex items-center gap-2"
              >
                <span>{role}</span>
                {idx === 0 && <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.2 rounded font-mono">PRIMARY</span>}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Skills Management Section */}
      <Card className="shadow-2xs">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base">Technical & Soft Competencies</CardTitle>
            <CardDescription>
              {profile.skills.length} skills indexed &bull; Used by AI for matching and gap analysis
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsAddSkillOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            Add Competency
          </Button>
        </CardHeader>
        <CardContent className="space-y-6 pt-2">
          {categories.map((cat) => {
            const catSkills = profile.skills.filter((s) => s.category === cat.id);
            if (catSkills.length === 0) return null;

            return (
              <div key={cat.id} className="space-y-2.5">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {cat.label} ({catSkills.length})
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {catSkills.map((sk) => (
                    <div
                      key={sk.id}
                      className="p-2.5 px-3 rounded-xl border border-slate-200/80 bg-white hover:border-slate-300 flex items-center justify-between shadow-2xs group"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-semibold text-xs text-slate-900 truncate flex items-center gap-1.5">
                          {sk.name}
                          {sk.verified && <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{sk.level}</div>
                      </div>
                      <button
                        onClick={() => removeSkill(sk.id)}
                        className="text-slate-300 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100"
                        title="Remove skill"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Certifications Section */}
      <Card className="shadow-2xs">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base">Verified Certifications & Accreditations</CardTitle>
            <CardDescription>Industry credentials that boost recruiter screening pass rate</CardDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsAddCertOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            Add Certificate
          </Button>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {profile.certifications.map((cert) => (
            <div
              key={cert.id}
              className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-xs sm:text-sm text-slate-900">{cert.title}</div>
                  <div className="text-[11px] text-slate-500">{cert.issuer} &bull; Issued {cert.issueDate}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="success" size="sm">Verified</Badge>
                <button
                  type="button"
                  onClick={() => removeCertification(cert.id)}
                  className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-colors"
                  title="Remove certificate"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        title="Edit Student Profile"
        description="Update your academic credentials and placement goals."
        size="lg"
      >
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <Input
            label="Full Name"
            value={profileForm.name}
            onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
            required
          />
          <Input
            label="Professional Headline"
            value={profileForm.headline}
            onChange={(e) => setProfileForm({ ...profileForm, headline: e.target.value })}
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="College / Institution"
              value={profileForm.institution}
              onChange={(e) => setProfileForm({ ...profileForm, institution: e.target.value })}
              required
            />
            <Input
              label="Cumulative GPA / CGPA"
              value={profileForm.gpa}
              onChange={(e) => setProfileForm({ ...profileForm, gpa: e.target.value })}
              required
            />
          </div>
          <Textarea
            label="Profile Executive Summary"
            rows={3}
            value={profileForm.bio}
            onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditProfileOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Skill Modal */}
      <Modal
        isOpen={isAddSkillOpen}
        onClose={() => setIsAddSkillOpen(false)}
        title="Add Verified Competency"
        description="Select category and proficiency level for accurate placement matching."
        size="md"
      >
        <form onSubmit={handleAddSkill} className="space-y-4">
          <Input
            label="Competency Name"
            placeholder="e.g. Docker, GraphQL, Kubernetes, Redis"
            value={skillForm.name}
            onChange={(e) => setSkillForm({ ...skillForm, name: e.target.value })}
            required
          />

          <Select
            label="Skill Category"
            value={skillForm.category}
            onChange={(e) => setSkillForm({ ...skillForm, category: e.target.value as any })}
            options={[
              { label: 'Programming Languages', value: 'languages' },
              { label: 'Frameworks & Libraries', value: 'frameworks' },
              { label: 'Databases & Storage', value: 'databases' },
              { label: 'Cloud, DevOps & Tooling', value: 'cloud' },
              { label: 'Interpersonal & Workflow', value: 'soft_skills' },
            ]}
          />

          <Select
            label="Proficiency Level"
            value={skillForm.level}
            onChange={(e) => setSkillForm({ ...skillForm, level: e.target.value as any })}
            options={[
              { label: 'Beginner (Basic Syntax & Conceptual Understanding)', value: 'Beginner' },
              { label: 'Intermediate (Built Projects / Coursework)', value: 'Intermediate' },
              { label: 'Advanced (Production Code / High Fluency)', value: 'Advanced' },
            ]}
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddSkillOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Add Skill
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Certificate Modal */}
      <Modal
        isOpen={isAddCertOpen}
        onClose={() => setIsAddCertOpen(false)}
        title="Add Accreditation / Certificate"
        description="Attach third-party certificates to your student record."
        size="md"
      >
        <form onSubmit={handleAddCert} className="space-y-4">
          <Input
            label="Certificate Title"
            placeholder="e.g. AWS Certified Solutions Architect"
            value={certForm.title}
            onChange={(e) => setCertForm({ ...certForm, title: e.target.value })}
            required
          />
          <Input
            label="Issuing Organization"
            placeholder="e.g. Amazon Web Services, Google Cloud, Coursera"
            value={certForm.issuer}
            onChange={(e) => setCertForm({ ...certForm, issuer: e.target.value })}
            required
          />
          <Input
            label="Issue Date"
            placeholder="e.g. October 2026"
            value={certForm.issueDate}
            onChange={(e) => setCertForm({ ...certForm, issueDate: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddCertOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Certificate
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
