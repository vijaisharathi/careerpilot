import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Target,
  DollarSign,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  RefreshCw,
  BookOpen,
  Award,
  Layers,
  History,
  Clock,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { ProgressBar } from '../components/common/ProgressBar';
import { Modal } from '../components/common/Modal';
import { useStudentData } from '../context/StudentDataContext';
import { useToast } from '../context/ToastContext';
import { CareerRole } from '../types/career.types';

export const CareerAnalysisPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    profile,
    updateProfile,
    rolesCatalog,
    latestAnalysis,
    analysisHistory,
    isAnalyzing,
    runCareerAnalysis,
    resume,
  } = useStudentData();
  const { success, error, info } = useToast();

  const [selectedSlug, setSelectedSlug] = useState<string>('full-stack-developer');
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Set default selected role matching student preference or first catalog role
  useEffect(() => {
    if (latestAnalysis?.targetRole?.slug) {
      setSelectedSlug(latestAnalysis.targetRole.slug);
    } else if (rolesCatalog.length > 0) {
      const match = rolesCatalog.find((r) =>
        profile.targetRoles.some((tr) => r.title.toLowerCase().includes(tr.toLowerCase()))
      );
      if (match) {
        setSelectedSlug(match.slug);
      } else {
        setSelectedSlug(rolesCatalog[0].slug);
      }
    }
  }, [rolesCatalog, latestAnalysis?.targetRole?.slug, profile.targetRoles]);

  const selectedRole: CareerRole | undefined =
    rolesCatalog.find((r) => r.slug === selectedSlug) || rolesCatalog[0];

  const handleRunAnalysis = async (slugToAnalyze: string) => {
    try {
      info('Running Career Engine', `Evaluating competencies and computing readiness for ${selectedRole?.title || 'role'}...`);
      const result = await runCareerAnalysis(slugToAnalyze);
      success('Analysis Completed', `Readiness Score calculated: ${result.scores.readinessScore}% (${result.scores.suitabilityLevel})`);
    } catch (err) {
      error('Analysis Failed', (err as Error).message || 'Could not complete career analysis. Ensure your profile has at least 1 skill.');
    }
  };

  const handleSetPrimary = (roleTitle: string) => {
    updateProfile({
      targetRoles: [roleTitle, ...profile.targetRoles.filter((r) => r !== roleTitle)],
    });
    success('Primary Target Updated', `Your primary placement goal is now set to ${roleTitle}.`);
  };

  const isCurrentRoleAnalyzed = latestAnalysis?.targetRole?.slug === selectedSlug;

  return (
    <div className="space-y-8 pb-12 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AI Career Fit & Suitability</h1>
            <Badge variant="info" size="sm">Deterministic Engine + LLM</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Algorithmic benchmark evaluating your skills, projects, and academic background against industry hiring standards.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {analysisHistory.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsHistoryModalOpen(true)}
              leftIcon={<History className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              History ({analysisHistory.length})
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={() => handleRunAnalysis(selectedSlug)}
            isLoading={isAnalyzing}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />}
            className="text-xs"
          >
            {isCurrentRoleAnalyzed ? 'Reanalyze Target Role' : 'Run AI Career Analysis'}
          </Button>
        </div>
      </div>

      {/* Stale Analysis Alert Banner */}
      {latestAnalysis?.isStale && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 text-amber-700">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-xs sm:text-sm">Profile Modified Since Last Analysis</div>
              <div className="text-xs text-amber-700 mt-0.5">
                Your technical skills or profile details have changed. Re-run the analysis to refresh your readiness scores and action plan.
              </div>
            </div>
          </div>
          <Button
            size="sm"
            variant="primary"
            onClick={() => handleRunAnalysis(selectedSlug)}
            isLoading={isAnalyzing}
            className="text-xs shrink-0 bg-amber-600 hover:bg-amber-700 border-amber-700"
          >
            Reanalyze Now
          </Button>
        </div>
      )}

      {/* Supported Career Roles Catalog Selector */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Supported Career Pathways ({rolesCatalog.length})
          </h2>
          <span className="text-xs text-slate-400">Select any role to view expectations and run readiness audit</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {rolesCatalog.map((role) => {
            const isSelected = selectedSlug === role.slug;
            const isPrimary = profile.targetRoles[0] === role.title;
            const hasAnalysis = latestAnalysis?.targetRole?.slug === role.slug;

            return (
              <button
                key={role.slug}
                type="button"
                onClick={() => setSelectedSlug(role.slug)}
                className={`p-3 rounded-xl border text-left transition-all relative ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                    {role.category}
                  </span>
                  {isPrimary && (
                    <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" title="Primary Goal" />
                  )}
                </div>

                <div className="font-semibold text-xs text-slate-900 mt-1 leading-snug line-clamp-2">
                  {role.title}
                </div>

                <div className="mt-2 flex items-center justify-between text-[10px]">
                  {hasAnalysis ? (
                    <span className="font-bold text-emerald-600">
                      {latestAnalysis.scores.readinessScore}% Match
                    </span>
                  ) : (
                    <span className="text-slate-400">Catalog Role</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Career Detailed Breakdown */}
      {selectedRole && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main 2-column Analysis Container */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-sm">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-xl">{selectedRole.title}</CardTitle>
                    {isCurrentRoleAnalyzed && latestAnalysis && (
                      <Badge
                        variant={
                          latestAnalysis.scores.suitabilityLevel === 'High Match'
                            ? 'success'
                            : latestAnalysis.scores.suitabilityLevel === 'Moderate Match'
                            ? 'warning'
                            : 'info'
                        }
                        size="sm"
                      >
                        {latestAnalysis.scores.suitabilityLevel}
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="mt-1">{selectedRole.description}</CardDescription>
                </div>

                {profile.targetRoles[0] === selectedRole.title ? (
                  <Badge variant="success" size="sm" className="self-start sm:self-auto shrink-0">
                    Primary Target Role
                  </Badge>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSetPrimary(selectedRole.title)}
                    className="text-xs self-start sm:self-auto shrink-0"
                  >
                    Set as Primary Target
                  </Button>
                )}
              </CardHeader>

              <CardContent className="space-y-6 pt-0">
                {/* Score Summary Metrics (If analyzed) */}
                {isCurrentRoleAnalyzed && latestAnalysis ? (
                  <div className="space-y-4">
                    {/* Top readiness meter */}
                    <div className="p-4 rounded-xl bg-slate-900 text-white shadow-md">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-amber-400" />
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                            Overall Career Placement Readiness
                          </span>
                        </div>
                        <span className="text-xl font-extrabold text-amber-400">
                          {latestAnalysis.scores.readinessScore} / 100
                        </span>
                      </div>
                      <ProgressBar
                        value={latestAnalysis.scores.readinessScore}
                        size="md"
                        variant={latestAnalysis.scores.readinessScore >= 75 ? 'primary' : 'warning'}
                      />
                      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-[11px] text-slate-300">
                        <div>
                          <div className="text-slate-400">Skill Match (50%)</div>
                          <div className="font-bold text-white text-xs">{latestAnalysis.scores.skillMatchScore}%</div>
                        </div>
                        <div>
                          <div className="text-slate-400">Project Depth (20%)</div>
                          <div className="font-bold text-white text-xs">{latestAnalysis.scores.projectScore}%</div>
                        </div>
                        <div>
                          <div className="text-slate-400">Experience (15%)</div>
                          <div className="font-bold text-white text-xs">{latestAnalysis.scores.experienceScore}%</div>
                        </div>
                        <div>
                          <div className="text-slate-400">Academics (15%)</div>
                          <div className="font-bold text-white text-xs">{latestAnalysis.scores.academicScore}%</div>
                        </div>
                      </div>
                    </div>

                    {/* AI Executive Summary Narrative */}
                    <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 uppercase tracking-wider">
                          <Sparkles className="w-4 h-4 text-indigo-600" />
                          AI Career Intelligence Summary
                        </div>
                        <span className="text-[10px] font-mono text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
                          {latestAnalysis.aiExplanation.aiProvider}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                        {latestAnalysis.aiExplanation.executiveSummary}
                      </p>
                    </div>

                    {/* Strengths & Gaps 2-column matrix */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Strengths */}
                      <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 space-y-2.5">
                        <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          Verified Strengths ({latestAnalysis.matchedSkills.length})
                        </div>
                        <ul className="space-y-1.5 text-xs text-slate-700">
                          {latestAnalysis.matchedSkills.map((sk, idx) => (
                            <li key={idx} className="flex items-center justify-between">
                              <span className="truncate pr-2 font-medium">{sk.name}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono shrink-0">
                                {sk.studentLevel}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Gaps */}
                      <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/30 space-y-2.5">
                        <div className="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            Skill Gaps to Bridge ({latestAnalysis.missingSkills.length})
                          </span>
                          <button
                            type="button"
                            onClick={() => navigate('/skill-gap')}
                            className="text-[10px] text-rose-700 underline font-normal"
                          >
                            Matrix
                          </button>
                        </div>
                        <ul className="space-y-1.5 text-xs text-slate-700">
                          {latestAnalysis.missingSkills.slice(0, 5).map((sk, idx) => (
                            <li key={idx} className="flex items-center justify-between">
                              <span className="truncate pr-2">{sk.name}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-mono shrink-0">
                                Need {sk.requiredLevel}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Tailored Capstone Projects */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-slate-700" />
                        <h3 className="text-sm font-bold text-slate-900">
                          Recommended High-Yield Projects
                        </h3>
                      </div>
                      <div className="space-y-2.5">
                        {latestAnalysis.aiExplanation.tailoredProjects.map((proj, idx) => (
                          <div
                            key={idx}
                            className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors shadow-2xs space-y-1.5"
                          >
                            <div className="font-semibold text-xs sm:text-sm text-slate-900 flex items-center justify-between">
                              <span>{proj.title}</span>
                              <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded">
                                Recommended
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              {proj.description}
                            </p>
                            {proj.impact && (
                              <div className="text-[11px] text-emerald-700 font-medium">
                                Impact: {proj.impact}
                              </div>
                            )}
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {proj.skillsCovered.map((s, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-mono"
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Milestone Action Plan */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-700" />
                        <h3 className="text-sm font-bold text-slate-900">
                          Personalized Placement Action Plan
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {latestAnalysis.aiExplanation.actionPlan.map((step, idx) => (
                          <div
                            key={idx}
                            className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 flex flex-col justify-between"
                          >
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                                {step.timeframe}
                              </span>
                              <div className="font-semibold text-xs text-slate-900 mt-2">
                                {step.objective}
                              </div>
                              <ul className="mt-2 space-y-1 text-[11px] text-slate-600">
                                {step.tasks.map((task, i) => (
                                  <li key={i} className="flex items-start gap-1.5">
                                    <span className="text-indigo-600 font-bold">&bull;</span>
                                    <span>{task}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  // Unanalyzed State for selected role
                  <div className="p-8 rounded-2xl border border-dashed border-slate-300 text-center space-y-4 bg-slate-50/50">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-sm">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div className="max-w-md mx-auto space-y-1">
                      <h3 className="font-bold text-slate-900 text-base">
                        Ready to Audit Fit for {selectedRole.title}?
                      </h3>
                      <p className="text-xs text-slate-500">
                        Career Pilot AI will cross-reference your {profile.skills.length} verified competencies, {resume.projects.length} projects, and academics against {selectedRole.requiredSkills.length} industry requirements.
                      </p>
                    </div>
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => handleRunAnalysis(selectedSlug)}
                      isLoading={isAnalyzing}
                      leftIcon={<Sparkles className="w-4 h-4" />}
                      className="text-xs shadow-md shadow-indigo-100"
                    >
                      Run AI Career Analysis
                    </Button>
                  </div>
                )}
              </CardContent>

              <CardFooter className="justify-between border-t border-slate-100 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/skill-gap')}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  className="text-xs"
                >
                  Inspect Complete Skill-Gap Matrix
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/roadmap')}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  className="text-xs"
                >
                  View Learning Roadmap
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Sidebar 1-column details */}
          <div className="space-y-6">
            {/* Market & Compensation Card */}
            <Card className="shadow-2xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Market Intelligence & Salary</CardTitle>
                <CardDescription>Verified 2026/2027 campus recruiting compensation data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Campus Entry Salary</div>
                  <div className="text-base font-extrabold text-slate-900">{selectedRole.averageSalary.entry}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Mid-Level Range</div>
                  <div className="text-base font-bold text-slate-800">{selectedRole.averageSalary.mid}</div>
                </div>

                <div className="space-y-2 text-xs text-slate-600 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Market Demand:</span>
                    <Badge variant="success" size="sm">{selectedRole.marketDemand}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Growth Outlook:</span>
                    <span className="font-semibold text-emerald-600">{selectedRole.growthOutlook}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Target Role Core Skill Requirements */}
            <Card className="shadow-2xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Expected Catalog Requirements</CardTitle>
                <CardDescription>Minimum proficiencies expected by hiring managers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {selectedRole.requiredSkills.map((sk, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg border border-slate-100 bg-white flex items-center justify-between text-xs"
                  >
                    <div className="truncate pr-2 font-medium text-slate-800">{sk.name}</div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                        {sk.minProficiency}
                      </span>
                      {sk.importance === 'critical' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" title="Critical Requirement" />
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recommended Industry Certifications */}
            <Card className="shadow-2xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  Recommended Accreditations
                </CardTitle>
                <CardDescription>Top screening filters verified by recruiters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5 pt-0">
                {selectedRole.recommendedCertifications.map((cert, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-1">
                    <div className="font-semibold text-xs text-slate-900">{cert.title}</div>
                    <div className="text-[11px] text-slate-500">{cert.issuer}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Analysis History Modal */}
      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="Career Analysis History"
        description="Review your previous AI career fit runs and score evolution."
        size="lg"
      >
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {analysisHistory.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-500">No past analysis runs recorded yet.</div>
          ) : (
            analysisHistory.map((item) => (
              <div
                key={item._id}
                className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 flex items-center justify-between text-xs"
              >
                <div className="space-y-1">
                  <div className="font-bold text-slate-900 text-sm">{item.targetRole.title}</div>
                  <div className="text-[11px] text-slate-500">
                    {new Date(item.createdAt).toLocaleDateString()} at{' '}
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-extrabold text-sm text-indigo-600">
                      {item.scores.readinessScore}% Readiness
                    </div>
                    <div className="text-[10px] text-slate-500">{item.scores.suitabilityLevel}</div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedSlug(item.targetRole.slug);
                      setIsHistoryModalOpen(false);
                    }}
                    className="text-xs"
                  >
                    View
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
};
