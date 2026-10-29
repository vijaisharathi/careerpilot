import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Target,
  CheckCircle2,
  AlertCircle,
  Plus,
  BookOpen,
  Clock,
  ArrowRight,
  TrendingUp,
  Sparkles,
  RefreshCw,
  Layers,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { ProgressBar } from '../components/common/ProgressBar';
import { useStudentData } from '../context/StudentDataContext';
import { useToast } from '../context/ToastContext';
import { CareerRole } from '../types/career.types';

export const SkillGapPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    profile,
    addSkill,
    rolesCatalog,
    latestAnalysis,
    isAnalyzing,
    runCareerAnalysis,
  } = useStudentData();
  const { success, error, info } = useToast();

  const [activeSlug, setActiveSlug] = useState<string>('full-stack-developer');

  useEffect(() => {
    if (latestAnalysis?.targetRole?.slug) {
      setActiveSlug(latestAnalysis.targetRole.slug);
    } else if (rolesCatalog.length > 0) {
      const match = rolesCatalog.find((r) =>
        profile.targetRoles.some((tr) => r.title.toLowerCase().includes(tr.toLowerCase()))
      );
      if (match) setActiveSlug(match.slug);
    }
  }, [rolesCatalog, latestAnalysis?.targetRole?.slug, profile.targetRoles]);

  const activeRole: CareerRole | undefined =
    rolesCatalog.find((r) => r.slug === activeSlug) || rolesCatalog[0];

  const isCurrentRoleAnalyzed = latestAnalysis?.targetRole?.slug === activeSlug;

  // Compute live match stats either from latestAnalysis or dynamic comparison
  const matchedSkillsList = isCurrentRoleAnalyzed && latestAnalysis
    ? latestAnalysis.matchedSkills
    : (activeRole?.requiredSkills || [])
        .filter((req) =>
          profile.skills.some((ps) =>
            ps.name.toLowerCase().includes(req.name.toLowerCase()) ||
            req.name.toLowerCase().includes(ps.name.toLowerCase())
          )
        )
        .map((req) => {
          const studentSkill = profile.skills.find(
            (ps) =>
              ps.name.toLowerCase().includes(req.name.toLowerCase()) ||
              req.name.toLowerCase().includes(ps.name.toLowerCase())
          );
          return {
            name: req.name,
            category: req.category,
            studentLevel: studentSkill?.level || 'Beginner',
            requiredLevel: req.minProficiency,
            status: 'met' as const,
            creditPercentage: 100,
          };
        });

  const missingSkillsList = isCurrentRoleAnalyzed && latestAnalysis
    ? latestAnalysis.missingSkills
    : (activeRole?.requiredSkills || [])
        .filter(
          (req) =>
            !profile.skills.some((ps) =>
              ps.name.toLowerCase().includes(req.name.toLowerCase()) ||
              req.name.toLowerCase().includes(ps.name.toLowerCase())
            )
        )
        .map((req) => ({
          name: req.name,
          category: req.category,
          requiredLevel: req.minProficiency,
          importance: req.importance,
          estimatedHours: req.minProficiency === 'Advanced' ? 30 : req.minProficiency === 'Intermediate' ? 20 : 10,
          whyNeeded:
            req.importance === 'critical'
              ? 'Required core competency for placement eligibility screening'
              : 'Recommended differentiator to rank above applicant peers',
        }));

  const totalGapHours = missingSkillsList.reduce((acc, g) => acc + (g.estimatedHours || 15), 0);
  const matchPercentage = isCurrentRoleAnalyzed && latestAnalysis
    ? latestAnalysis.scores.skillMatchScore
    : Math.round(
        (matchedSkillsList.length / Math.max(1, (activeRole?.requiredSkills?.length || 1))) * 100
      );

  const handleQuickAdd = async (skillName: string, category: any, requiredLevel: string) => {
    try {
      await addSkill({
        name: skillName,
        category: (category as any) || 'frameworks',
        level: (requiredLevel as any) || 'Beginner',
      });
      success('Skill Added to Profile', `Added ${skillName} (${requiredLevel || 'Beginner'}) to your profile.`);
    } catch (err) {
      error('Failed to Add', (err as Error).message);
    }
  };

  const handleRunAnalysis = async () => {
    try {
      info('Running Career Engine', `Auditing competency matrix for ${activeRole?.title}...`);
      await runCareerAnalysis(activeSlug);
      success('Audit Complete', 'Skill gap matrix synchronized with backend career engine.');
    } catch (err) {
      error('Analysis Failed', (err as Error).message || 'Failed to complete analysis.');
    }
  };

  return (
    <div className="space-y-8 pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Skill Gap Diagnostics</h1>
            <Badge variant="warning" size="sm">Technical Competency Audit</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pinpoints exact competency deficits required to achieve Tier-1 placement readiness.
          </p>
        </div>

        {/* Role Switcher & Action */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <select
            value={activeSlug}
            onChange={(e) => setActiveSlug(e.target.value)}
            className="text-xs font-semibold bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
          >
            {rolesCatalog.map((role) => (
              <option key={role.slug} value={role.slug}>
                {role.title} ({role.category})
              </option>
            ))}
          </select>

          <Button
            variant="primary"
            size="sm"
            onClick={handleRunAnalysis}
            isLoading={isAnalyzing}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />}
            className="text-xs"
          >
            {isCurrentRoleAnalyzed ? 'Refresh Audit' : 'Run Audit'}
          </Button>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-2xs">
          <CardContent className="pt-6">
            <div className="text-xs font-semibold uppercase text-slate-500">Skill Competency Match</div>
            <div className="text-3xl font-extrabold text-slate-900 mt-2">{matchPercentage}%</div>
            <ProgressBar value={matchPercentage} size="sm" variant={matchPercentage >= 75 ? 'primary' : 'warning'} className="mt-3" />
            <p className="text-[11px] text-slate-400 mt-2">
              Based on {matchedSkillsList.length} of {activeRole?.requiredSkills?.length || 0} catalog requirements
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardContent className="pt-6">
            <div className="text-xs font-semibold uppercase text-slate-500">Critical Gaps Remaining</div>
            <div className="text-3xl font-extrabold text-rose-600 mt-2">
              {missingSkillsList.filter((s) => s.importance === 'critical').length} Critical
            </div>
            <p className="text-xs text-slate-500 mt-3">
              Est. time to bridge all gaps: <strong>~{totalGapHours} Hours</strong>
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardContent className="pt-6">
            <div className="text-xs font-semibold uppercase text-slate-500">Verified Strengths</div>
            <div className="text-3xl font-extrabold text-emerald-600 mt-2">{matchedSkillsList.length} Skills</div>
            <p className="text-xs text-slate-500 mt-3">Ready for technical screening rounds</p>
          </CardContent>
        </Card>
      </div>

      {/* Verified Strengths List */}
      <Card className="shadow-2xs">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Acquired Competencies Matching {activeRole?.title}</span>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {matchedSkillsList.length === 0 ? (
            <div className="text-xs text-slate-500 italic py-2">
              No overlapping skills recorded yet for this role. Add skills on your Profile page or below.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {matchedSkillsList.map((sk, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{sk.name}</span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1 rounded font-mono">
                    {sk.studentLevel}
                  </span>
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Complete Skill Comparison Table */}
      {activeRole && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Full Role Competency Comparison</span>
            </div>
            <CardDescription>
              Detailed breakdown of how your current skill proficiencies compare against {activeRole.title} industry benchmarks.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Expected Skill</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Required Level</th>
                    <th className="py-3 px-4">Your Level</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeRole.requiredSkills.map((req, idx) => {
                    const matched = matchedSkillsList.find((m) =>
                      m.name.toLowerCase().includes(req.name.toLowerCase()) ||
                      req.name.toLowerCase().includes(m.name.toLowerCase())
                    );
                    const isMissing = !matched;

                    return (
                      <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          <div className="flex items-center gap-2">
                            <span>{req.name}</span>
                            {req.importance === 'critical' && (
                              <span className="text-[9px] bg-rose-50 text-rose-700 border border-rose-200 px-1 py-0.2 rounded font-bold">
                                CRITICAL
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 capitalize text-slate-500">{req.category.replace('_', ' ')}</td>
                        <td className="py-3 px-4 font-mono font-medium">{req.minProficiency}</td>
                        <td className="py-3 px-4 font-mono">
                          {matched ? (
                            <span className="font-semibold text-slate-800">{matched.studentLevel}</span>
                          ) : (
                            <span className="text-slate-400 italic">Not in profile</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {matched ? (
                            <Badge variant="success" size="sm">Met</Badge>
                          ) : (
                            <Badge variant="danger" size="sm">Missing</Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {isMissing && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleQuickAdd(req.name, req.category, req.minProficiency)}
                              leftIcon={<Plus className="w-3 h-3" />}
                              className="text-[11px] py-1 h-7"
                            >
                              Add to Profile
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Missing Skills Deep Dive Cards */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>Missing High-Priority Competencies ({missingSkillsList.length})</span>
          </div>
          <CardDescription>
            Closing these gaps is estimated to increase your recruiter callback and screening rate.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          {missingSkillsList.length === 0 ? (
            <div className="p-6 rounded-xl bg-emerald-50 text-emerald-800 text-center text-xs font-semibold">
              🎉 Congratulations! You have acquired all core technical requirements for {activeRole?.title}!
            </div>
          ) : (
            missingSkillsList.map((gap, idx) => (
              <div
                key={idx}
                className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 shadow-2xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-sm text-slate-900">{gap.name}</span>
                    <Badge variant={gap.importance === 'critical' ? 'danger' : 'warning'} size="sm">
                      {gap.importance === 'critical' ? 'Critical Gap' : 'Recommended'}
                    </Badge>
                    <span className="text-[11px] text-slate-400 capitalize">
                      {gap.category?.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>~{gap.estimatedHours} Hours Required</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-1">
                  <div className="font-semibold text-slate-700">Recruiter Screening Impact:</div>
                  <p>{gap.whyNeeded}</p>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAdd(gap.name, gap.category, gap.requiredLevel)}
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                    className="text-xs"
                  >
                    Mark as Learning Goal
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/roadmap')}
                    rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                    className="text-xs text-indigo-600 hover:text-indigo-700"
                  >
                    View Roadmap Modules
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
        <CardFooter className="justify-between border-t border-slate-100 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/career-analysis')}
            className="text-xs"
          >
            Back to Career Fit Analysis
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/roadmap')}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            Generate Learning Roadmap
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
