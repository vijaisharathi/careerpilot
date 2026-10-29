import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  ArrowRight,
  ArrowLeft,
  GraduationCap,
  Target,
  Sparkles,
  CheckCircle2,
  BookOpen,
  Calendar,
  Briefcase,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Card, CardContent } from '../components/common/Card';
import { ProgressBar } from '../components/common/ProgressBar';
import { Input, Select } from '../components/common/FormControls';
import { useStudentData } from '../context/StudentDataContext';
import { useToast } from '../context/ToastContext';

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, updateProfile, addSkill } = useStudentData();
  const { success } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  // Form State
  const [formData, setFormData] = useState({
    institution: profile.education.institution,
    degree: profile.education.degree,
    major: profile.education.major,
    graduationYear: profile.education.graduationYear,
    currentYear: profile.education.currentYear,
    gpa: profile.education.gpa,
    targetRole: profile.targetRoles[0] || 'Full-Stack Software Engineer',
    preferredMode: 'Hybrid',
    driveStartMonth: 'August 2026',
    selectedSkills: ['TypeScript', 'React.js', 'Node.js & Express', 'MongoDB & Mongoose'],
  });

  const availableSkills = [
    'JavaScript (ES6+)',
    'TypeScript',
    'Python',
    'Java',
    'C++',
    'React.js',
    'Node.js & Express',
    'Tailwind CSS',
    'Next.js',
    'MongoDB & Mongoose',
    'PostgreSQL',
    'Redis',
    'Docker',
    'AWS Cloud',
    'Git & GitHub',
    'Data Structures & Algorithms',
    'System Design',
    'REST APIs',
  ];

  const toggleSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedSkills: prev.selectedSkills.includes(skill)
        ? prev.selectedSkills.filter((s) => s !== skill)
        : [...prev.selectedSkills, skill],
    }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      // Save and navigate to dashboard
      updateProfile({
        education: {
          institution: formData.institution,
          degree: formData.degree,
          major: formData.major,
          graduationYear: Number(formData.graduationYear),
          currentYear: formData.currentYear,
          gpa: formData.gpa,
        },
        targetRoles: [formData.targetRole],
      });
      formData.selectedSkills.forEach((skillName) => {
        if (!profile.skills.some((s) => s.name.toLowerCase() === skillName.toLowerCase())) {
          addSkill({
            name: skillName,
            category: 'languages',
            level: 'Intermediate',
          });
        }
      });
      success('Onboarding Complete!', 'Your customized placement roadmap and skill matrix have been created.');
      navigate('/dashboard');
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full mx-auto space-y-8">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
              <Compass className="w-5 h-5" />
            </div>
            <span className="font-bold text-slate-900 text-lg">Career Pilot AI</span>
          </div>

          <div className="text-xs font-semibold text-slate-500">
            Step {currentStep} of {totalSteps}
          </div>
        </div>

        {/* Progress Bar */}
        <ProgressBar value={(currentStep / totalSteps) * 100} size="sm" variant="primary" />

        {/* Wizard Card */}
        <Card className="border-slate-200/90 shadow-md">
          <CardContent className="pt-6 sm:p-8">
            {/* Step 1: Academic Background */}
            {currentStep === 1 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="space-y-1">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">Academic Background</h2>
                  <p className="text-xs text-slate-500">
                    Tell us about your university and current academic standing.
                  </p>
                </div>

                <div className="space-y-3.5 pt-2">
                  <Input
                    label="College / Institute Name"
                    value={formData.institution}
                    onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                    required
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Select
                      label="Degree Program"
                      value={formData.degree}
                      onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                      options={[
                        { label: 'Bachelor of Science (B.S.)', value: 'Bachelor of Science (B.S.)' },
                        { label: 'Bachelor of Technology (B.Tech)', value: 'Bachelor of Technology (B.Tech)' },
                        { label: 'Bachelor of Engineering (B.E.)', value: 'Bachelor of Engineering (B.E.)' },
                        { label: 'Master of Science (M.S.)', value: 'Master of Science (M.S.)' },
                      ]}
                    />

                    <Select
                      label="Major / Branch"
                      value={formData.major}
                      onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                      options={[
                        { label: 'Computer Science', value: 'Computer Science' },
                        { label: 'Information Technology', value: 'Information Technology' },
                        { label: 'Computer Engineering', value: 'Computer Engineering' },
                        { label: 'Data Science / AI', value: 'Data Science / AI' },
                      ]}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Select
                      label="Current Academic Year"
                      value={formData.currentYear}
                      onChange={(e) => setFormData({ ...formData, currentYear: e.target.value })}
                      options={[
                        { label: '1st Year (Freshman)', value: '1st Year (Freshman)' },
                        { label: '2nd Year (Sophomore)', value: '2nd Year (Sophomore)' },
                        { label: '3rd Year (Junior)', value: '3rd Year (Junior)' },
                        { label: '4th Year (Senior)', value: '4th Year (Senior)' },
                      ]}
                    />

                    <Input
                      label="Cumulative GPA / CGPA"
                      placeholder="e.g. 3.8 / 4.0 or 8.5 / 10"
                      value={formData.gpa}
                      onChange={(e) => setFormData({ ...formData, gpa: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Target Roles */}
            {currentStep === 2 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="space-y-1">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
                    <Target className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">Primary Placement Goal</h2>
                  <p className="text-xs text-slate-500">
                    Select your primary target engineering discipline for campus drives.
                  </p>
                </div>

                <div className="space-y-2.5 pt-2">
                  {[
                    {
                      id: 'Full-Stack Software Engineer',
                      desc: 'React, Node.js, TypeScript, RESTful architectures, and database design.',
                      badge: 'High Campus Demand',
                    },
                    {
                      id: 'Backend Systems Engineer',
                      desc: 'High-throughput APIs, SQL/NoSQL databases, concurrency, and microservices.',
                      badge: 'High Compensation',
                    },
                    {
                      id: 'Cloud & DevOps Engineer',
                      desc: 'Docker, Kubernetes, AWS/GCP, CI/CD deployment pipelines, and infrastructure as code.',
                      badge: 'Fast Growth',
                    },
                    {
                      id: 'Data Scientist & AI Solutions Engineer',
                      desc: 'Python, ML models, vector databases, LLM orchestration, and telemetry analytics.',
                      badge: 'Emerging Frontier',
                    },
                  ].map((role) => (
                    <div
                      key={role.id}
                      onClick={() => setFormData({ ...formData, targetRole: role.id })}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start justify-between ${
                        formData.targetRole === role.id
                          ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-sm text-slate-900">{role.id}</div>
                        <p className="text-xs text-slate-500 mt-1">{role.desc}</p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 shrink-0">
                        {role.badge}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Current Technical Skills */}
            {currentStep === 3 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="space-y-1">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">Select Known Competencies</h2>
                  <p className="text-xs text-slate-500">
                    Tap the languages, tools, and frameworks you currently feel confident using.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 pt-2 max-h-64 overflow-y-auto p-1">
                  {availableSkills.map((sk) => {
                    const isSelected = formData.selectedSkills.includes(sk);
                    return (
                      <button
                        key={sk}
                        type="button"
                        onClick={() => toggleSkill(sk)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {sk}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-slate-400">
                  Selected: {formData.selectedSkills.length} competencies (you can add more anytime in your profile).
                </p>
              </div>
            )}

            {/* Step 4: Placement Timeline & Summary */}
            {currentStep === 4 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="space-y-1">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">Ready to Generate Plan!</h2>
                  <p className="text-xs text-slate-500">
                    Review your intake summary before initializing your personalized roadmap.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs text-slate-700">
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-400">Institution:</span>
                    <span className="font-semibold text-slate-900">{formData.institution}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-400">Major & Year:</span>
                    <span className="font-semibold text-slate-900">{formData.major} ({formData.currentYear})</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-400">Target Role:</span>
                    <span className="font-semibold text-indigo-600">{formData.targetRole}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Initial Skills:</span>
                    <span className="font-semibold text-slate-900">{formData.selectedSkills.length} mapped</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>Calculated baseline readiness score: <strong>72% match</strong> against entry-level roles.</span>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-6">
              {currentStep > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleBack}
                  leftIcon={<ArrowLeft className="w-4 h-4" />}
                >
                  Back
                </Button>
              ) : (
                <div />
              )}

              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleNext}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {currentStep === totalSteps ? 'Launch Placement Dashboard' : 'Continue'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-center text-xs text-slate-400 py-4">
        &copy; {new Date().getFullYear()} Career Pilot AI. Production SaaS Architecture.
      </div>
    </div>
  );
};

