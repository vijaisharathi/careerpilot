import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  GraduationCap,
  Award,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Calendar,
  Clock,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Code2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { ProgressBar } from '../../components/common/ProgressBar';
import { Spinner } from '../../components/common/Spinner';
import { placementService } from '../../services/placement.service';
import { codingService } from '../../services/coding.service';
import { PlacementStudentDetail } from '../../types/placement.types';
import { useToast } from '../../context/ToastContext';

export const PlacementStudentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { error: toastError } = useToast();

  const [dossier, setDossier] = useState<PlacementStudentDetail | null>(null);
  const [codingSummary, setCodingSummary] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDossier = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await placementService.getStudentDetail(id);
      setDossier(data);
      try {
        const coding = await codingService.getCandidateTechnicalSummary(id);
        setCodingSummary(coding);
      } catch {
        // Non-blocking: student may not have coding records yet
      }
    } catch (err) {
      toastError('Failed to load dossier', (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [id, toastError]);

  useEffect(() => {
    loadDossier();
  }, [loadDossier]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Spinner size="lg" className="text-emerald-600 mb-3" />
        <p className="text-xs font-medium text-slate-500">Querying institutional dossier...</p>
      </div>
    );
  }

  if (!dossier) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="mx-auto h-12 w-12 text-rose-500 mb-3" />
        <h2 className="text-base font-bold text-slate-900">Student Dossier Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">
          The requested student does not exist or does not belong to your institution.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/placement/students')}
          className="mt-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to Student Directory
        </Button>
      </div>
    );
  }

  const { student, readiness, registrations } = dossier;

  const getReadinessBadge = (category: string) => {
    switch (category) {
      case 'Ready':
        return <Badge variant="success" className="bg-emerald-50 text-emerald-700 border-emerald-200">Ready</Badge>;
      case 'Nearly Ready':
        return <Badge variant="warning" className="bg-amber-50 text-amber-700 border-amber-200">Nearly Ready</Badge>;
      case 'Needs Preparation':
        return <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">Needs Prep</Badge>;
      default:
        return <Badge variant="default" className="bg-slate-100 text-slate-600 border-slate-200">Insufficient Data</Badge>;
    }
  };

  const getStageBadge = (stage: string) => {
    switch (stage) {
      case 'accepted':
      case 'offered':
        return <Badge variant="success" className="bg-emerald-50 text-emerald-700 border-emerald-200 uppercase tracking-wider">{stage}</Badge>;
      case 'interview':
      case 'selected':
        return <Badge variant="warning" className="bg-purple-50 text-purple-700 border-purple-200 uppercase tracking-wider">{stage}</Badge>;
      case 'assessment':
      case 'shortlisted':
        return <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 uppercase tracking-wider">{stage}</Badge>;
      case 'rejected':
      case 'withdrawn':
        return <Badge variant="danger" className="bg-rose-50 text-rose-700 border-rose-200 uppercase tracking-wider">{stage}</Badge>;
      default:
        return <Badge variant="default" className="bg-slate-100 text-slate-600 uppercase tracking-wider">{stage}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/placement/students')}
          className="text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          <span>Back to Directory</span>
        </Button>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span className="text-xs font-semibold text-slate-500">
            Institutional Privacy Compliant Dossier
          </span>
        </div>
      </div>

      {/* Student Safe Header Card */}
      <Card className="border border-slate-200/80 shadow-sm bg-gradient-to-r from-white via-slate-50/50 to-white">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-xl bg-emerald-600 text-white font-bold text-2xl flex items-center justify-center shrink-0 shadow-md">
                {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-slate-900">{student.name}</h1>
                  {getReadinessBadge(readiness.category)}
                  <Badge
                    variant={student.placementStatus === 'placed' ? 'success' : 'default'}
                    className={
                      student.placementStatus === 'placed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }
                  >
                    {student.placementStatus.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500">{student.email}</p>
                {student.headline && (
                  <p className="text-xs text-slate-600 font-medium pt-0.5">{student.headline}</p>
                )}
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-2">
                  <span className="flex items-center gap-1">
                    <GraduationCap className="h-3.5 w-3.5 text-slate-400" />
                    {student.degree} in {student.department}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    Batch of {student.graduationYear || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Overall Score Circle */}
            <div className="flex items-center gap-5 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6">
              <div className="text-center">
                <div className="relative inline-flex items-center justify-center">
                  <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    {readiness.overallScore}
                  </span>
                  <span className="text-xs font-semibold text-slate-400 ml-0.5">/100</span>
                </div>
                <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mt-0.5">
                  Readiness Score
                </div>
                <div className="text-[10px] text-slate-400">Deterministic Engine</div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 border-l border-slate-100 pl-4">
                <div>
                  Profile Completion:{' '}
                  <span className="font-semibold text-slate-900">
                    {student.completionPercentage}%
                  </span>
                </div>
                <div>
                  Verified Skills:{' '}
                  <span className="font-semibold text-slate-900">
                    {student.skills.length}
                  </span>
                </div>
                <div>
                  Completed Projects:{' '}
                  <span className="font-semibold text-slate-900">
                    {student.projectsCount}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid: Readiness Breakdown & Skills */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Readiness Breakdown (2 columns) */}
        <Card className="lg:col-span-2 border border-slate-200/80 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/40 py-3.5 px-6">
            <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Award className="h-4 w-4 text-emerald-600" />
              <span>Readiness Assessment Breakdown</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Evaluated strictly on profile completeness, verified skills, assessment results, and interview prep.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Category Sub-scores */}
            <div className="space-y-3.5">
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                  <span>Profile Completeness (25% Weight)</span>
                  <span className="font-semibold">{readiness.breakdown.profileCompletenessScore} / 25</span>
                </div>
                <ProgressBar
                  value={(readiness.breakdown.profileCompletenessScore / 25) * 100}
                  variant="primary"
                  className="h-2"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                  <span>Technical Skills Assessment (25% Weight)</span>
                  <span className="font-semibold">{readiness.breakdown.skillsScore} / 25</span>
                </div>
                <ProgressBar
                  value={(readiness.breakdown.skillsScore / 25) * 100}
                  variant="primary"
                  className="h-2"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                  <span>Career Assessment Analysis (20% Weight)</span>
                  <span className="font-semibold">{readiness.breakdown.careerAssessmentScore} / 20</span>
                </div>
                <ProgressBar
                  value={(readiness.breakdown.careerAssessmentScore / 20) * 100}
                  variant="primary"
                  className="h-2"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                  <span>Verified Resume Readiness (15% Weight)</span>
                  <span className="font-semibold">{readiness.breakdown.resumeScore} / 15</span>
                </div>
                <ProgressBar
                  value={(readiness.breakdown.resumeScore / 15) * 100}
                  variant="primary"
                  className="h-2"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                  <span>AI Mock Interview Practice (15% Weight)</span>
                  <span className="font-semibold">{readiness.breakdown.interviewPracticeScore} / 15</span>
                </div>
                <ProgressBar
                  value={(readiness.breakdown.interviewPracticeScore / 15) * 100}
                  variant="primary"
                  className="h-2"
                />
              </div>
            </div>

            {/* Criteria Evaluation Checklist */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Verified Qualifications ({readiness.passedCriteria.length})</span>
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  {readiness.passedCriteria.length > 0 ? (
                    readiness.passedCriteria.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 bg-emerald-50/50 p-2 rounded border border-emerald-100">
                        <span className="text-emerald-700 font-medium">✓</span>
                        <span>{item}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-slate-400 italic">No passed qualifications recorded.</li>
                  )}
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <span>Identified Gaps ({readiness.missingCriteria.length})</span>
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  {readiness.missingCriteria.length > 0 ? (
                    readiness.missingCriteria.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 bg-amber-50/50 p-2 rounded border border-amber-100">
                        <span className="text-amber-700 font-bold">!</span>
                        <span>{item}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-emerald-700 font-medium italic">All readiness criteria met!</li>
                  )}
                </ul>
              </div>
            </div>

            {/* Actionable Recommendations */}
            {readiness.recommendations.length > 0 && (
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Recommended Student Actions to Achieve Placement Readiness</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-600">
                  {readiness.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Skills & Target Roles (1 column) */}
        <div className="space-y-6">
          <Card className="border border-slate-200/80 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/40 py-3.5 px-6">
              <CardTitle className="text-sm font-semibold text-slate-900">
                Verified Candidate Skills ({student.skills.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {student.skills.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No verified skills entered yet.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {student.skills.map((skill, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="bg-slate-100 text-slate-800 text-[11px] px-2 py-0.5 border border-slate-200"
                    >
                      {skill.name}
                      {skill.proficiency && (
                        <span className="text-[10px] text-slate-500 ml-1">({skill.proficiency})</span>
                      )}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border border-slate-200/80 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/40 py-3.5 px-6">
              <CardTitle className="text-sm font-semibold text-slate-900">
                Career Aspirations & Target Roles
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {student.targetRoles && student.targetRoles.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {student.targetRoles.map((role, idx) => (
                    <Badge
                      key={idx}
                      variant="primary"
                      className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs px-2.5 py-1 font-medium"
                    >
                      {role}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No target roles specified.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Technical & Coding Assessment Evaluation */}
      <Card className="border border-slate-200/80 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-slate-200/80 bg-slate-50/50 py-3.5 px-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Code2 className="h-4 w-4 text-emerald-600" />
              <span>Verified Coding & Technical Skills Evaluation</span>
            </CardTitle>
            {codingSummary && (
              <Badge variant="primary" className="bg-emerald-50 text-emerald-800 border-emerald-200">
                Score: {codingSummary.overallCodingScore || 0}/100
              </Badge>
            )}
          </div>
          <CardDescription className="text-xs text-slate-500">
            Deterministic evaluation from algorithmic problem solving, language benchmarks, and timed coding assessments.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {!codingSummary || (!codingSummary.totalProblemsSolved && !codingSummary.totalSubmissions) ? (
            <div className="text-center py-6 text-xs text-slate-400">
              <Code2 className="mx-auto h-8 w-8 text-slate-300 mb-2" />
              <p>No coding assessment submissions recorded yet for this student.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase">Coding Score</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">{codingSummary.overallCodingScore || 0}</div>
                  <ProgressBar value={codingSummary.overallCodingScore || 0} variant="primary" className="h-1.5 mt-2" />
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase">Problems Solved</div>
                  <div className="text-2xl font-black text-emerald-600 mt-1">{codingSummary.totalProblemsSolved || 0}</div>
                  <div className="text-[10px] text-slate-400 mt-1">Total Verified</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase">Total Submissions</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">{codingSummary.totalSubmissions || 0}</div>
                  <div className="text-[10px] text-slate-400 mt-1">Code Runs</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase">Languages Used</div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {codingSummary.languageProficiencies?.length ? (
                      codingSummary.languageProficiencies.map((lp: any, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-[10px] bg-white border">
                          {lp.language} ({lp.problemsSolved})
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400">None</span>
                    )}
                  </div>
                </div>
              </div>

              {codingSummary.categoryProficiencies?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Category Breakdown & Accuracy
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {codingSummary.categoryProficiencies.map((cat: any, idx: number) => (
                      <div key={idx} className="p-3 bg-slate-50/60 rounded-md border border-slate-100 text-xs">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold text-slate-800 capitalize">{cat.category}</span>
                          <span className="text-slate-500">{cat.problemsSolved}/{cat.totalAttempted} solved ({cat.accuracyPercentage}%)</span>
                        </div>
                        <ProgressBar value={cat.accuracyPercentage} variant={cat.accuracyPercentage >= 70 ? 'success' : 'primary'} className="h-1.5" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Campus Recruitment History */}
      <Card className="border border-slate-200/80 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-slate-200/80 bg-slate-50/50 py-3.5 px-6">
          <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-emerald-600" />
            <span>Campus Recruitment Drive Registrations ({registrations.length})</span>
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Live stage progression across on-campus recruitment opportunities.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          {registrations.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Briefcase className="mx-auto h-10 w-10 text-slate-300 mb-2" />
              <p className="text-xs font-medium text-slate-600">Candidate has not registered for any campus recruitment drives yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Company & Drive</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Eligibility</th>
                    <th className="py-3 px-4">Current Stage</th>
                    <th className="py-3 px-4">Applied Date</th>
                    <th className="py-3 px-4">Offer Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {registrations.map((reg) => (
                    <tr key={reg.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{reg.companyName}</div>
                        <div className="text-[11px] text-slate-400">{reg.driveTitle}</div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">{reg.jobRole}</td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={reg.eligibilityStatus === 'eligible' ? 'success' : 'warning'}
                          className="text-[11px]"
                        >
                          {reg.eligibilityStatus.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">{getStageBadge(reg.currentStage)}</td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(reg.appliedDate).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4">
                        {reg.offerDetails?.salary ? (
                          <div>
                            <span className="font-bold text-emerald-700">{reg.offerDetails.salary}</span>
                            <div className="text-[10px] text-slate-400">{reg.offerDetails.designation || 'Offer Extended'}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

