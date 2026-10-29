import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Calendar,
  Users,
  Download,
  Filter,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldAlert,
  ChevronRight,
  TrendingUp,
  Award,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input, Select, Textarea } from '../../components/common/FormControls';
import { Spinner } from '../../components/common/Spinner';
import { placementService } from '../../services/placement.service';
import {
  PlacementDriveItem,
  DriveCandidateItem,
  RecruitmentStage,
  CandidateEligibilityStatus,
} from '../../types/placement.types';
import { useToast } from '../../context/ToastContext';

export const PlacementDriveDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();

  const [drive, setDrive] = useState<PlacementDriveItem | null>(null);
  const [candidates, setCandidates] = useState<DriveCandidateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [stageFilter, setStageFilter] = useState('all');
  const [eligibilityFilter, setEligibilityFilter] = useState('all');

  // Stage Transition Modal
  const [selectedCandidate, setSelectedCandidate] = useState<DriveCandidateItem | null>(null);
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  const [targetStage, setTargetStage] = useState<RecruitmentStage>('shortlisted');
  const [stageComment, setStageComment] = useState('');
  const [salaryOffered, setSalaryOffered] = useState('');
  const [designationOffered, setDesignationOffered] = useState('');
  const [updatingStage, setUpdatingStage] = useState(false);

  // Eligibility Override Modal
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [overrideStatus, setOverrideStatus] = useState<CandidateEligibilityStatus>('eligible');
  const [overrideReason, setOverrideReason] = useState('');
  const [submittingOverride, setSubmittingOverride] = useState(false);

  // View Evaluation Modal
  const [evalCandidate, setEvalCandidate] = useState<DriveCandidateItem | null>(null);

  const loadDriveAndCandidates = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [driveData, candidateData] = await Promise.all([
        placementService.getDriveDetail(id),
        placementService.getDriveCandidates(id, {
          stage: stageFilter !== 'all' ? stageFilter : undefined,
          eligibility: eligibilityFilter !== 'all' ? eligibilityFilter : undefined,
        }),
      ]);
      setDrive(driveData);
      setCandidates(candidateData);
    } catch (err) {
      toastError('Failed to load drive details', (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [id, stageFilter, eligibilityFilter, toastError]);

  useEffect(() => {
    loadDriveAndCandidates();
  }, [loadDriveAndCandidates]);

  const handleExportCsv = async () => {
    if (!id) return;
    try {
      setExporting(true);
      const blob = await placementService.exportCsv('candidates', id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `candidates_${drive?.companyName || 'drive'}_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toastSuccess('Export Complete', 'Candidates roster exported successfully.');
    } catch (err) {
      toastError('Export Failed', (err as Error).message);
    } finally {
      setExporting(false);
    }
  };

  const handleUpdateStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !selectedCandidate) return;

    try {
      setUpdatingStage(true);
      const offerDetails =
        targetStage === 'offered' || targetStage === 'accepted'
          ? {
              salary: salaryOffered.trim() || undefined,
              designation: designationOffered.trim() || undefined,
            }
          : undefined;

      await placementService.updateCandidateStage(
        id,
        selectedCandidate.id,
        targetStage,
        stageComment.trim() || undefined,
        offerDetails
      );

      toastSuccess(
        'Stage Updated',
        `${selectedCandidate.studentName} advanced to ${targetStage.toUpperCase()}.`
      );
      setIsStageModalOpen(false);
      setStageComment('');
      setSalaryOffered('');
      setDesignationOffered('');
      loadDriveAndCandidates();
    } catch (err) {
      toastError('Stage Transition Failed', (err as Error).message);
    } finally {
      setUpdatingStage(false);
    }
  };

  const handleOverrideEligibility = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !selectedCandidate) return;
    if (!overrideReason.trim()) {
      toastError('Reason Required', 'An immutable audit reason must be documented for any manual override.');
      return;
    }

    try {
      setSubmittingOverride(true);
      await placementService.overrideCandidateEligibility(
        id,
        selectedCandidate.id,
        overrideStatus,
        overrideReason.trim()
      );

      toastSuccess(
        'Eligibility Overridden',
        `Eligibility for ${selectedCandidate.studentName} updated with audit record.`
      );
      setIsOverrideModalOpen(false);
      setOverrideReason('');
      loadDriveAndCandidates();
    } catch (err) {
      toastError('Override Failed', (err as Error).message);
    } finally {
      setSubmittingOverride(false);
    }
  };

  const getEligibilityBadge = (status: CandidateEligibilityStatus) => {
    switch (status) {
      case 'eligible':
        return <Badge variant="success" className="bg-emerald-50 text-emerald-700 border-emerald-200">Eligible</Badge>;
      case 'needs_review':
        return <Badge variant="warning" className="bg-amber-50 text-amber-700 border-amber-200">Needs Review</Badge>;
      case 'not_eligible':
        return <Badge variant="danger" className="bg-rose-50 text-rose-700 border-rose-200">Not Eligible</Badge>;
      case 'insufficient_information':
      default:
        return <Badge variant="default" className="bg-slate-100 text-slate-600">Incomplete Info</Badge>;
    }
  };

  const getStageBadge = (stage: RecruitmentStage) => {
    switch (stage) {
      case 'accepted':
      case 'offered':
        return <Badge variant="success" className="bg-emerald-100 text-emerald-800 font-bold uppercase">{stage}</Badge>;
      case 'selected':
      case 'interview':
        return <Badge variant="warning" className="bg-purple-100 text-purple-800 font-semibold uppercase">{stage}</Badge>;
      case 'assessment':
      case 'shortlisted':
        return <Badge variant="secondary" className="bg-sky-100 text-sky-800 uppercase">{stage}</Badge>;
      case 'rejected':
      case 'withdrawn':
        return <Badge variant="danger" className="bg-rose-100 text-rose-800 uppercase">{stage}</Badge>;
      case 'registered':
      default:
        return <Badge variant="default" className="bg-slate-100 text-slate-700 uppercase">{stage}</Badge>;
    }
  };

  if (loading && !drive) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Spinner size="lg" className="text-emerald-600 mb-3" />
        <p className="text-xs font-medium text-slate-500">Loading drive roster...</p>
      </div>
    );
  }

  if (!drive) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="mx-auto h-12 w-12 text-rose-500 mb-3" />
        <h2 className="text-base font-bold text-slate-900">Recruitment Drive Not Found</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/placement/drives')}
          className="mt-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to Drives
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/placement/drives')}
          className="text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          <span>Back to Drives</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCsv}
          disabled={exporting}
          className="flex items-center gap-2 border-slate-300 text-slate-700"
        >
          {exporting ? <Spinner size="sm" /> : <Download className="h-4 w-4" />}
          <span>Export Candidates CSV</span>
        </Button>
      </div>

      {/* Drive Metadata Card */}
      <Card className="border border-slate-200/80 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-slate-900">{drive.companyName}</h1>
                <Badge variant="primary" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                  {drive.status.replace('_', ' ').toUpperCase()}
                </Badge>
                <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                  {drive.workMode}
                </Badge>
                <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                  {drive.employmentType}
                </Badge>
              </div>

              <div className="text-sm font-semibold text-slate-800">
                {drive.driveTitle} • <span className="text-emerald-700">{drive.jobRole}</span>
              </div>

              <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
                {drive.jobDescription}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                <span>Location: <strong className="text-slate-700">{drive.location}</strong></span>
                {drive.compensation?.amount && (
                  <span>Package: <strong className="text-emerald-700">{drive.compensation.amount} ({drive.compensation.period})</strong></span>
                )}
                <span>Registration Deadline: <strong className="text-slate-700">{new Date(drive.registrationDeadline).toLocaleDateString()}</strong></span>
              </div>
            </div>

            {/* Criteria Box */}
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1.5 shrink-0 max-w-xs">
              <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1">
                Eligibility Rules
              </div>
              <div>Min CGPA: <strong>{drive.eligibilityCriteria.minGpa ?? 'None'}</strong></div>
              <div>Min Profile %: <strong>{drive.eligibilityCriteria.minProfileCompletion ?? 0}%</strong></div>
              <div>Min Readiness Score: <strong>{drive.eligibilityCriteria.minReadinessScore ?? 0} pts</strong></div>
              <div>Depts: <strong>{drive.eligibilityCriteria.eligibleDepartments.join(', ') || 'All'}</strong></div>
              <div>Batches: <strong>{drive.eligibilityCriteria.eligibleGraduationYears.join(', ') || 'All'}</strong></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter and Candidate Table */}
      <Card className="border border-slate-200/80 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-200/80 py-3.5 px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-sm font-semibold text-slate-900">
                Registered Candidates ({candidates.length})
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Live recruitment pipeline with rule-based eligibility evaluation and stage progression.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="text-xs w-36"
              >
                <option value="all">All Stages</option>
                <option value="registered">Registered</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="assessment">Assessment</option>
                <option value="interview">Interview</option>
                <option value="selected">Selected</option>
                <option value="offered">Offered</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
              </Select>

              <Select
                value={eligibilityFilter}
                onChange={(e) => setEligibilityFilter(e.target.value)}
                className="text-xs w-36"
              >
                <option value="all">All Eligibility</option>
                <option value="eligible">Eligible</option>
                <option value="needs_review">Needs Review</option>
                <option value="not_eligible">Not Eligible</option>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {candidates.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Users className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <h3 className="text-sm font-semibold text-slate-900">No candidates registered</h3>
              <p className="text-xs text-slate-500 mt-1">
                No students match the current recruitment stage and eligibility filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Candidate</th>
                    <th className="py-3 px-4">Dept & Batch</th>
                    <th className="py-3 px-4">Rule Eligibility</th>
                    <th className="py-3 px-4">Current Stage</th>
                    <th className="py-3 px-4">Applied Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {candidates.map((cand) => (
                    <tr key={cand.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{cand.studentName}</div>
                        <div className="text-[11px] text-slate-400">{cand.studentEmail}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{cand.department}</div>
                        <div className="text-[11px] text-slate-400">Class of {cand.graduationYear || 'N/A'}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          {getEligibilityBadge(cand.eligibilityStatus)}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEvalCandidate(cand)}
                            className="p-0.5 h-auto text-slate-400 hover:text-slate-600"
                            title="Inspect Rule-Based Checks"
                          >
                            <HelpCircle className="h-3.5 w-3.5" />
                          </Button>
                          {cand.eligibilityEvaluation?.isOverridden && (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1 py-0.5 rounded border border-amber-200" title={`Overridden: ${cand.eligibilityEvaluation.overrideReason}`}>
                              OVERRIDDEN
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">{getStageBadge(cand.currentStage)}</td>

                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(cand.appliedDate).toLocaleDateString()}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedCandidate(cand);
                              setTargetStage(cand.currentStage);
                              setIsStageModalOpen(true);
                            }}
                            className="text-xs h-7 px-2.5 text-slate-700 hover:bg-slate-100"
                          >
                            Advance Stage
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedCandidate(cand);
                              setOverrideStatus(cand.eligibilityStatus === 'eligible' ? 'needs_review' : 'eligible');
                              setIsOverrideModalOpen(true);
                            }}
                            className="text-xs h-7 px-2 text-amber-700 border-amber-200 hover:bg-amber-50"
                            title="Override Eligibility"
                          >
                            <ShieldAlert className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal: Advance Recruitment Stage */}
      <Modal
        isOpen={isStageModalOpen}
        onClose={() => setIsStageModalOpen(false)}
        title={`Advance Candidate: ${selectedCandidate?.studentName}`}
        size="md"
      >
        <form onSubmit={handleUpdateStage} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Target Recruitment Stage *
            </label>
            <Select
              value={targetStage}
              onChange={(e) => setTargetStage(e.target.value as RecruitmentStage)}
              className="text-xs"
              required
            >
              <option value="registered">Registered</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="assessment">Assessment</option>
              <option value="interview">Interview</option>
              <option value="selected">Selected</option>
              <option value="offered">Offered</option>
              <option value="accepted">Accepted (Marks Placed)</option>
              <option value="rejected">Rejected</option>
              <option value="withdrawn">Withdrawn</option>
            </Select>
          </div>

          {(targetStage === 'offered' || targetStage === 'accepted') && (
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 space-y-3">
              <div className="text-xs font-bold text-emerald-900">
                Official Placement Offer Details
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Salary / Package Amount (e.g. 14 LPA)
                </label>
                <Input
                  value={salaryOffered}
                  onChange={(e) => setSalaryOffered(e.target.value)}
                  placeholder="14 LPA"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Designation / Role Title
                </label>
                <Input
                  value={designationOffered}
                  onChange={(e) => setDesignationOffered(e.target.value)}
                  placeholder="Software Engineer"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Officer Notes / Transition Comment
            </label>
            <Textarea
              rows={2}
              value={stageComment}
              onChange={(e) => setStageComment(e.target.value)}
              placeholder="e.g. Cleared round 1 technical interview with high recommendation..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsStageModalOpen(false)}
              disabled={updatingStage}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={updatingStage}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {updatingStage ? <Spinner size="sm" className="mr-1.5" /> : null}
              Confirm Stage Update
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Manual Eligibility Override */}
      <Modal
        isOpen={isOverrideModalOpen}
        onClose={() => setIsOverrideModalOpen(false)}
        title={`Manual Eligibility Override: ${selectedCandidate?.studentName}`}
        size="md"
      >
        <form onSubmit={handleOverrideEligibility} className="space-y-4">
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 leading-relaxed">
            <strong>Security Notice:</strong> Manual overrides are strictly recorded in the institutional audit log with your officer credentials and timestamp.
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Overridden Status *
            </label>
            <Select
              value={overrideStatus}
              onChange={(e) => setOverrideStatus(e.target.value as CandidateEligibilityStatus)}
              className="text-xs"
              required
            >
              <option value="eligible">Eligible</option>
              <option value="needs_review">Needs Review</option>
              <option value="not_eligible">Not Eligible</option>
            </Select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mandatory Justification / Documented Reason *
            </label>
            <Textarea
              rows={3}
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="Document the exact basis for this override (e.g. Verified special dean approval, lateral transfer equivalent GPA)..."
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsOverrideModalOpen(false)}
              disabled={submittingOverride}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={submittingOverride}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {submittingOverride ? <Spinner size="sm" className="mr-1.5" /> : null}
              Submit Override & Audit Record
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: View Rule-Based Evaluation Details */}
      <Modal
        isOpen={!!evalCandidate}
        onClose={() => setEvalCandidate(null)}
        title={`Eligibility Rules: ${evalCandidate?.studentName}`}
        size="md"
      >
        {evalCandidate && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-200">
              <span className="font-semibold text-slate-700">Calculated Status:</span>
              {getEligibilityBadge(evalCandidate.eligibilityStatus)}
            </div>

            <div>
              <h4 className="font-bold text-slate-800 mb-1.5 uppercase text-[11px]">Passed Checks</h4>
              <ul className="space-y-1">
                {evalCandidate.eligibilityEvaluation?.passedChecks?.map((c, i) => (
                  <li key={i} className="flex items-center gap-1.5 text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    <span>{c}</span>
                  </li>
                )) || <li className="text-slate-400 italic">No passed checks.</li>}
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-800 mb-1.5 uppercase text-[11px]">Failed / Missing Checks</h4>
              <ul className="space-y-1">
                {evalCandidate.eligibilityEvaluation?.failedChecks?.map((c, i) => (
                  <li key={i} className="flex items-center gap-1.5 text-rose-700">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{c}</span>
                  </li>
                )) || <li className="text-emerald-700 italic">None - all requirements satisfied.</li>}
              </ul>
            </div>

            {evalCandidate.eligibilityEvaluation?.notes && (
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-slate-600">
                <strong>Rule Engine Notes:</strong> {evalCandidate.eligibilityEvaluation.notes}
              </div>
            )}

            {evalCandidate.eligibilityEvaluation?.isOverridden && (
              <div className="p-2.5 bg-amber-50 rounded border border-amber-200 text-amber-800">
                <strong>Overridden Reason:</strong> {evalCandidate.eligibilityEvaluation.overrideReason}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

