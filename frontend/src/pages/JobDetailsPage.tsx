import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Clock,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Bookmark,
  BookmarkCheck,
  Send,
  Share2,
  Briefcase,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  Check,
  HelpCircle,
  XCircle,
  GraduationCap,
  Award,
  Layers,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { useStudentData } from '../context/StudentDataContext';
import { useToast } from '../context/ToastContext';
import { jobService } from '../services/job.service';
import { BackendJobOpportunity, JobAiInsights } from '../types/job.types';
import { sanitizeExternalUrl } from '../utils/url';

export const JobDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addApplication, applications } = useStudentData();
  const { success, info, error: toastError } = useToast();

  const [job, setJob] = useState<BackendJobOpportunity | null>(null);
  const [aiInsights, setAiInsights] = useState<JobAiInsights | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyNotes, setApplyNotes] = useState('');

  // Fetch opportunity details
  useEffect(() => {
    if (!id) return;
    const loadDetails = async () => {
      setIsLoading(true);
      try {
        const data = await jobService.getJobByIdOrSlug(id);
        setJob(data);

        // Fetch AI Insights
        setIsAiLoading(true);
        jobService
          .getAiInsights(data._id)
          .then((res) => setAiInsights(res))
          .catch(() => {})
          .finally(() => setIsAiLoading(false));
      } catch (err) {
        console.error('Failed to load opportunity:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadDetails();
  }, [id]);

  if (isLoading || !job) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-pulse">
        <div className="h-8 bg-slate-200/70 rounded-lg w-48" />
        <div className="h-44 bg-slate-200/70 rounded-2xl w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-slate-200/70 rounded-2xl" />
          <div className="h-64 bg-slate-200/70 rounded-2xl" />
        </div>
      </div>
    );
  }

  const isAlreadyApplied = applications.some(
    (a) =>
      a.jobId === job._id ||
      (a.company.toLowerCase() === job.company.toLowerCase() &&
        a.role.toLowerCase() === job.title.toLowerCase())
  );

  const matchScore = job.match?.matchScore ?? 75;
  const suitability = job.match?.suitability ?? 'Moderate Match';
  const matchedSkills = job.match?.matchedSkills || [];
  const missingSkills = job.match?.missingSkills || [];
  const eligibility = job.match?.eligibility;

  const handleToggleSave = async () => {
    const isCurrentlySaved = !!job.isSaved;
    setJob((prev) => (prev ? { ...prev, isSaved: !isCurrentlySaved } : prev));

    try {
      if (isCurrentlySaved) {
        await jobService.unsaveJob(job._id);
        success('Opportunity Unsaved', `Removed ${job.company} from saved list.`);
      } else {
        await jobService.saveJob(job._id);
        success('Opportunity Saved! 🔖', `Added ${job.company} to bookmarked positions.`);
      }
    } catch (err) {
      setJob((prev) => (prev ? { ...prev, isSaved: isCurrentlySaved } : prev));
      toastError('Save Failed', (err as Error).message || 'Could not update save status.');
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addApplication({
        jobId: job._id,
        company: job.company,
        role: job.title,
        location: job.location,
        type: job.employmentType === 'Full-time' ? 'Full-time' : 'Internship',
        appliedDate: new Date().toISOString().split('T')[0],
        stage: 'applied',
        compensation: job.compensation?.amount || 'Competitive',
        nextStep: 'Awaiting recruiter review or OA assessment link',
        notes: applyNotes || 'Applied via Career Pilot AI Discovery.',
      });

      setIsApplyModalOpen(false);
      success(
        'Application Recorded! 🚀',
        `${job.company} added to your active application tracker pipeline.`
      );
    } catch (err) {
      toastError(
        'Could not track application',
        (err as Error).message || 'Unable to record this application.'
      );
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    info('Link Copied', 'Opportunity link copied to clipboard.');
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* 1. Back button */}
      <div>
        <button
          onClick={() => navigate('/jobs')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Opportunities
        </button>
      </div>

      {/* 2. Demo Disclaimer Banner */}
      <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5 shadow-2xs">
        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-semibold">Demonstration Vacancy:</strong> {job.demoDisclaimer}
        </div>
      </div>

      {/* 3. Main Hero Card */}
      <Card className="shadow-sm border-slate-200">
        <CardContent className="pt-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-6 pb-6 border-b border-slate-100">
            <div className="flex items-start gap-4">
              <img
                src={job.companyLogo}
                alt={job.company}
                className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shrink-0 shadow-xs"
              />
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    {job.title}
                  </h1>
                  <Badge
                    variant={matchScore >= 80 ? 'success' : matchScore >= 60 ? 'info' : 'warning'}
                    size="sm"
                    dot
                  >
                    {matchScore}% Student Match
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                  <span className="text-slate-800 font-semibold">{job.company}</span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> {job.location} ({job.workMode})
                  </span>
                  <span>&bull;</span>
                  <span className="text-emerald-700 font-bold">{job.compensation?.amount}</span>
                </div>
              </div>
            </div>

            {/* Top Action Buttons */}
            <div className="flex items-center gap-2 self-end sm:self-start shrink-0">
              <button
                type="button"
                onClick={handleShare}
                className="p-2 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-400 hover:text-slate-700 transition-colors"
                title="Share role"
              >
                <Share2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleToggleSave}
                className="p-2 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-400 hover:text-indigo-600 transition-colors"
                title={job.isSaved ? 'Saved' : 'Save opportunity'}
              >
                {job.isSaved ? (
                  <BookmarkCheck className="w-4 h-4 text-indigo-600" />
                ) : (
                  <Bookmark className="w-4 h-4" />
                )}
              </button>

              <a
                href={sanitizeExternalUrl(job.applicationUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1 transition-colors"
              >
                <span>Company Portal</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>

              {isAlreadyApplied ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate('/applications')}
                  className="text-xs"
                >
                  View in Tracker
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setIsApplyModalOpen(true)}
                  leftIcon={<Send className="w-3.5 h-3.5" />}
                  className="text-xs bg-indigo-600 hover:bg-indigo-500 shadow-xs"
                >
                  Track / Apply
                </Button>
              )}
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 uppercase text-[10px] block font-semibold">Role Type</span>
              <strong className="text-slate-800 text-sm">{job.employmentType}</strong>
            </div>
            <div>
              <span className="text-slate-400 uppercase text-[10px] block font-semibold">Work Mode</span>
              <strong className="text-slate-800 text-sm">{job.workMode}</strong>
            </div>
            <div>
              <span className="text-slate-400 uppercase text-[10px] block font-semibold">Experience Level</span>
              <strong className="text-slate-800 text-sm">
                {job.experienceRequirements?.level || 'Entry-Level'}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 uppercase text-[10px] block font-semibold">Deadline</span>
              <strong className="text-slate-800 text-sm">
                {job.applicationDeadline
                  ? new Date(job.applicationDeadline).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'Open Rolling Basis'}
              </strong>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Match Breakdown & Academic Eligibility Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card A: Skill Match Breakdown */}
        <Card className="shadow-2xs border-slate-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Skill Compatibility Breakdown</CardTitle>
              <Badge variant={matchScore >= 80 ? 'success' : 'info'} size="sm">
                {matchScore}% {suitability}
              </Badge>
            </div>
            <CardDescription>
              Deterministic scoring against required skills for {job.company}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            {/* Matched skills list */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Matching Skills ({matchedSkills.length})
              </span>
              <div className="space-y-1.5">
                {matchedSkills.map((sk, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-emerald-50/40 border border-emerald-100 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-800">{sk.name}</span>
                      <span className="text-[11px] text-slate-500 ml-2">
                        (Your level: {sk.studentProficiency})
                      </span>
                    </div>
                    <Badge variant="success" size="sm">
                      {sk.creditPercentage}% Credit
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Missing skills list */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                Missing Qualifications ({missingSkills.length})
              </span>
              {missingSkills.length > 0 ? (
                <div className="space-y-1.5">
                  {missingSkills.map((sk, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-rose-50/40 border border-rose-100 flex items-center justify-between text-xs"
                    >
                      <span className="font-semibold text-slate-800">{sk.name}</span>
                      <Badge variant={sk.importance === 'critical' ? 'danger' : 'warning'} size="sm">
                        {sk.importance === 'critical' ? 'Critical Gap' : 'Recommended'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-100 font-medium">
                  🎉 Full skill alignment! Your profile covers all stated technical skills.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card B: Academic & Candidate Eligibility Checklist (Separate from match score!) */}
        <Card className="shadow-2xs border-slate-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-indigo-600" />
                <CardTitle className="text-base">Academic Eligibility Audit</CardTitle>
              </div>
              {eligibility?.verdict === 'Eligible' ? (
                <Badge variant="success" size="sm">
                  Eligible
                </Badge>
              ) : eligibility?.verdict === 'Requires Verification' ? (
                <Badge variant="warning" size="sm">
                  Requires Verification
                </Badge>
              ) : (
                <Badge variant="danger" size="sm">
                  Not Eligible
                </Badge>
              )}
            </div>
            <CardDescription>
              Evaluated strictly independently from your technical skill match score
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-0 text-xs">
            {eligibility ? (
              <>
                <p className="text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {eligibility.summary}
                </p>

                <div className="space-y-2 pt-1">
                  {eligibility.criteria.map((crit, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border flex flex-col gap-1 ${
                        crit.status === 'eligible'
                          ? 'border-emerald-200 bg-emerald-50/20'
                          : crit.status === 'unverified'
                          ? 'border-amber-200 bg-amber-50/20'
                          : 'border-rose-200 bg-rose-50/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{crit.criterion}</span>
                        {crit.status === 'eligible' ? (
                          <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5 text-emerald-600" /> Verified Match
                          </span>
                        ) : crit.status === 'unverified' ? (
                          <span className="text-[11px] font-semibold text-amber-700 flex items-center gap-1">
                            <HelpCircle className="w-3.5 h-3.5 text-amber-600" /> Unverified
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-rose-700 flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" /> Ineligible
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-500">
                        <strong>Required:</strong> {crit.required} &bull; <strong>Your Profile:</strong>{' '}
                        {crit.studentValue}
                      </div>
                      <div className="text-[11px] text-slate-600 pt-0.5">{crit.note}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-xs text-slate-400 py-6 text-center">
                Sign in to audit your academic eligibility against this posting.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 5. AI Requirement Insights & Strategy Card */}
      {aiInsights && (
        <Card className="shadow-2xs border-indigo-100 bg-gradient-to-r from-indigo-50/40 via-white to-slate-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-900 font-bold text-base">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>AI Preparation Strategy & Opportunity Insights</span>
              </div>
              <Badge variant="neutral" size="sm">
                {aiInsights.aiProvider}
              </Badge>
            </div>
            <CardDescription>
              Tailored candidate positioning advice based on your skill match
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-0 text-xs sm:text-sm text-slate-700 leading-relaxed">
            <div className="p-3 rounded-xl bg-white border border-indigo-100/80 space-y-1">
              <strong className="text-indigo-900 text-xs font-bold uppercase tracking-wider block">
                Target Candidate Persona
              </strong>
              <p className="text-xs text-slate-600">{aiInsights.roleSummary}</p>
            </div>

            <div className="p-3 rounded-xl bg-white border border-indigo-100/80 space-y-1">
              <strong className="text-amber-900 text-xs font-bold uppercase tracking-wider block">
                Skill Gap Remediation
              </strong>
              <p className="text-xs text-slate-600">{aiInsights.gapBridgeTip}</p>
            </div>

            <div className="p-3 rounded-xl bg-white border border-indigo-100/80 space-y-1">
              <strong className="text-emerald-900 text-xs font-bold uppercase tracking-wider block">
                Resume Optimization Tip
              </strong>
              <p className="text-xs text-slate-600">{aiInsights.resumeOptimizationTip}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 6. Description & Responsibilities */}
      <Card className="shadow-2xs border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Role Overview & Candidate Responsibilities</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <p>{job.description}</p>

          {job.responsibilities && job.responsibilities.length > 0 && (
            <div className="pt-2">
              <h4 className="font-bold text-slate-900 text-sm mb-2">Key Responsibilities:</h4>
              <ul className="space-y-1.5 pl-4 list-disc marker:text-indigo-600">
                {job.responsibilities.map((resp, idx) => (
                  <li key={idx}>{resp}</li>
                ))}
              </ul>
            </div>
          )}

          {job.preferredSkills && job.preferredSkills.length > 0 && (
            <div className="pt-2">
              <h4 className="font-bold text-slate-900 text-sm mb-2">Preferred / Good-to-Have Skills:</h4>
              <div className="flex flex-wrap gap-1.5">
                {job.preferredSkills.map((sk, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium"
                  >
                    {sk}
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="justify-between">
          <span className="text-xs text-slate-400">
            Source: {job.source} &bull; Campus Drive Ready
          </span>
          <div className="flex items-center gap-2">
            <a
              href={sanitizeExternalUrl(job.applicationUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1"
            >
              <span>Apply on Company Site</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
            <Button size="sm" variant="primary" onClick={() => setIsApplyModalOpen(true)}>
              Track in Pipeline
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Application Tracking Modal */}
      <Modal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        title={`Track Application — ${job.company}`}
        description="Record this position in your student placement application tracker board."
        size="md"
      >
        <form onSubmit={handleApply} className="space-y-4 py-2">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
            <div>
              <strong>Position:</strong> {job.title}
            </div>
            <div>
              <strong>Company:</strong> {job.company}
            </div>
            <div>
              <strong>Location:</strong> {job.location} ({job.workMode})
            </div>
            <div>
              <strong>Match Score:</strong> {matchScore}%
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Referral Contact or Application Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={applyNotes}
              onChange={(e) => setApplyNotes(e.target.value)}
              placeholder="e.g. Applied via enterprise career portal, reached out to alumni on LinkedIn."
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsApplyModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Confirm & Track Application
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
