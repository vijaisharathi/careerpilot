import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Award,
  ChevronDown,
  ChevronUp,
  Bell,
  Layers,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Spinner } from '../components/common/Spinner';
import { Tabs } from '../components/common/Tabs';
import { placementService } from '../services/placement.service';
import {
  StudentCampusDriveItem,
  CandidateEligibilityStatus,
  RecruitmentStage,
} from '../types/placement.types';
import { useToast } from '../context/ToastContext';

export const CampusDrivesPage: React.FC = () => {
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<'drives' | 'registrations' | 'notices'>('drives');
  const [institutionName, setInstitutionName] = useState<string>('Apex Institute of Technology');
  const [drives, setDrives] = useState<StudentCampusDriveItem[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [registeringId, setRegisteringId] = useState<string | null>(null);
  const [expandedCriteria, setExpandedCriteria] = useState<Record<string, boolean>>({});

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [drivesRes, annRes] = await Promise.all([
        placementService.getStudentCampusDrives(),
        placementService.getStudentAnnouncements(),
      ]);
      setInstitutionName(drivesRes.institution?.name || 'Apex Institute of Technology');
      setDrives(drivesRes.drives || []);
      setAnnouncements(annRes || []);
    } catch (err) {
      toastError('Failed to load campus drives', (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleCriteria = (driveId: string) => {
    setExpandedCriteria((prev) => ({ ...prev, [driveId]: !prev[driveId] }));
  };

  const handleRegister = async (driveId: string, companyName: string) => {
    try {
      setRegisteringId(driveId);
      await placementService.registerForCampusDrive(driveId);
      toastSuccess(
        'Registration Submitted',
        `Successfully registered for ${companyName}! Track your application progress here or in the Application Tracker.`
      );
      loadData();
    } catch (err) {
      toastError('Registration Failed', (err as Error).message);
    } finally {
      setRegisteringId(null);
    }
  };

  const getEligibilityBadge = (status: CandidateEligibilityStatus) => {
    switch (status) {
      case 'eligible':
        return <Badge variant="success" className="bg-emerald-50 text-emerald-700 border-emerald-200">Eligible to Apply</Badge>;
      case 'needs_review':
        return <Badge variant="warning" className="bg-amber-50 text-amber-700 border-amber-200">Department Review</Badge>;
      case 'not_eligible':
        return <Badge variant="danger" className="bg-rose-50 text-rose-700 border-rose-200">Not Eligible</Badge>;
      case 'insufficient_information':
      default:
        return <Badge variant="default" className="bg-slate-100 text-slate-600">Incomplete Profile</Badge>;
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

  const registeredDrives = drives.filter((d) => d.isRegistered);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Campus Recruitment Drives
            </h1>
            <Badge variant="primary" className="bg-emerald-50 text-emerald-700 border-emerald-200">
              {institutionName}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Exclusive on-campus placement opportunities, automated rule-based eligibility checks, and 1-click registration.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/applications')}
            className="flex items-center gap-2 text-slate-700 hover:bg-slate-50"
          >
            <Briefcase className="h-4 w-4" />
            <span>Application Tracker</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('drives')}
          className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'drives'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>Active Campus Drives ({drives.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('registrations')}
          className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'registrations'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>My Applications ({registeredDrives.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('notices')}
          className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'notices'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Bell className="h-4 w-4" />
          <span>Placement Notices ({announcements.length})</span>
        </button>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Spinner size="lg" className="text-emerald-600 mb-3" />
          <p className="text-xs font-medium text-slate-500">Querying campus recruitment opportunities...</p>
        </div>
      ) : activeTab === 'drives' ? (
        /* Tab 1: Active Drives */
        <div className="space-y-4">
          {drives.length === 0 ? (
            <Card className="border border-slate-200/80 shadow-sm text-center py-16 px-4">
              <Building2 className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <h3 className="text-sm font-semibold text-slate-900">No active campus drives scheduled</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Check back soon or watch the Placement Notices tab for upcoming company visits and eligibility criteria.
              </p>
            </Card>
          ) : (
            drives.map((drive) => {
              const driveId = drive._id || drive.id || '';
              const isEligible = drive.eligibilityResult.status === 'eligible';
              const isExpanded = !!expandedCriteria[driveId];

              return (
                <Card key={driveId} className="border border-slate-200/80 shadow-sm overflow-hidden hover:border-slate-300 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                      <div className="space-y-3 max-w-2xl">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h2 className="text-lg font-bold text-slate-900">{drive.companyName}</h2>
                          {getEligibilityBadge(drive.eligibilityResult.status)}
                          <Badge variant="secondary" className="bg-slate-100 text-slate-700 text-xs">
                            {drive.workMode}
                          </Badge>
                          <Badge variant="secondary" className="bg-slate-100 text-slate-700 text-xs">
                            {drive.employmentType}
                          </Badge>
                        </div>

                        <div>
                          <div className="text-sm font-semibold text-slate-800">
                            {drive.driveTitle} • <span className="text-emerald-700">{drive.jobRole}</span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                            {drive.jobDescription}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            Deadline: <strong>{new Date(drive.registrationDeadline).toLocaleDateString()}</strong>
                          </span>
                          {drive.compensation?.amount && (
                            <span className="flex items-center gap-1 font-semibold text-emerald-700">
                              <Award className="h-3.5 w-3.5 text-emerald-600" />
                              Package: {drive.compensation.amount} ({drive.compensation.period})
                            </span>
                          )}
                          <span>Location: {drive.location}</span>
                        </div>

                        {/* Expandable Criteria Breakdown */}
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => toggleCriteria(driveId)}
                            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                          >
                            <span>Inspect My Eligibility Verification</span>
                            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          </button>

                          {isExpanded && (
                            <div className="mt-3 p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2">
                              <div>
                                <div className="font-bold text-slate-700 mb-1">Satisfied Checks:</div>
                                <ul className="space-y-1">
                                  {drive.eligibilityResult.passedChecks.map((chk, i) => (
                                    <li key={i} className="flex items-center gap-1.5 text-emerald-700">
                                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                                      <span>{chk}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              {drive.eligibilityResult.failedChecks.length > 0 && (
                                <div className="pt-2 border-t border-slate-200">
                                  <div className="font-bold text-rose-700 mb-1">Missing Requirements:</div>
                                  <ul className="space-y-1">
                                    {drive.eligibilityResult.failedChecks.map((chk, i) => (
                                      <li key={i} className="flex items-center gap-1.5 text-rose-700">
                                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                        <span>{chk}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              <div className="pt-1 text-[11px] text-slate-400 italic">
                                {drive.eligibilityResult.notes}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Box */}
                      <div className="flex flex-col items-end justify-center gap-3 shrink-0 border-t lg:border-t-0 pt-4 lg:pt-0">
                        {drive.isRegistered ? (
                          <div className="text-right space-y-1.5 bg-slate-50 p-4 rounded-lg border border-slate-200 min-w-[200px]">
                            <div className="text-[11px] font-semibold text-slate-500 uppercase">
                              Application Status
                            </div>
                            <div>{getStageBadge(drive.registrationDetails?.currentStage || 'registered')}</div>
                            <div className="text-[10px] text-slate-400">
                              Applied on {new Date(drive.registrationDetails?.appliedDate || drive.createdAt).toLocaleDateString()}
                            </div>
                            {drive.registrationDetails?.offerDetails?.salary && (
                              <div className="text-xs font-bold text-emerald-700 pt-1">
                                Offered: {drive.registrationDetails.offerDetails.salary}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-2 text-right">
                            <Button
                              variant="primary"
                              size="md"
                              disabled={!isEligible || registeringId === driveId || !drive.isRegistrationOpen}
                              onClick={() => handleRegister(driveId, drive.companyName)}
                              className={`w-full sm:w-auto font-semibold ${
                                isEligible
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                              }`}
                            >
                              {registeringId === driveId ? (
                                <Spinner size="sm" className="mr-2" />
                              ) : (
                                <Send className="h-4 w-4 mr-2" />
                              )}
                              {isEligible ? '1-Click Register for Drive' : 'Criteria Not Met'}
                            </Button>
                            {!isEligible && (
                              <p className="text-[11px] text-slate-400 max-w-xs text-right">
                                Review missing criteria above or update your profile to satisfy requirements.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      ) : activeTab === 'registrations' ? (
        /* Tab 2: My Registrations */
        <div className="space-y-4">
          {registeredDrives.length === 0 ? (
            <Card className="border border-slate-200/80 shadow-sm text-center py-16 px-4">
              <CheckCircle2 className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <h3 className="text-sm font-semibold text-slate-900">No active campus applications</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Explore available campus drives and submit your 1-click registration to participate in on-campus recruitment.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setActiveTab('drives')}
                className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Browse Campus Drives
              </Button>
            </Card>
          ) : (
            registeredDrives.map((drive) => {
              const driveId = drive._id || drive.id || '';
              const stage = drive.registrationDetails?.currentStage || 'registered';

              return (
                <Card key={driveId} className="border border-slate-200/80 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-bold text-base text-slate-900">{drive.companyName}</h3>
                          {getStageBadge(stage)}
                        </div>
                        <div className="text-xs font-semibold text-slate-700 mt-1">
                          {drive.driveTitle} • {drive.jobRole}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          Registered on {new Date(drive.registrationDetails?.appliedDate || drive.createdAt).toLocaleDateString()}
                        </div>
                        {drive.registrationDetails?.offerDetails?.salary && (
                          <div className="mt-2 p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 inline-block text-xs">
                            <span className="font-bold text-emerald-900">Official Placement Offer:</span>{' '}
                            <span className="font-semibold text-emerald-700">
                              {drive.registrationDetails.offerDetails.salary} ({drive.registrationDetails.offerDetails.designation || 'Offer Extended'})
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate('/applications')}
                          className="text-xs text-slate-700"
                        >
                          <span>View in App Tracker</span>
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      ) : (
        /* Tab 3: Placement Notices */
        <div className="space-y-4">
          {announcements.length === 0 ? (
            <Card className="border border-slate-200/80 shadow-sm text-center py-16 px-4">
              <Bell className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <h3 className="text-sm font-semibold text-slate-900">No circulars posted</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Your placement office has not broadcast any circulars for your department or graduation cohort.
              </p>
            </Card>
          ) : (
            announcements.map((ann) => (
              <Card key={ann.id} className="border border-slate-200/80 shadow-sm">
                <CardContent className="p-6 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <h3 className="font-bold text-base text-slate-900">{ann.title}</h3>
                    <div className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{new Date(ann.publicationDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                    {ann.content}
                  </p>

                  {ann.relatedDrive && (
                    <div className="pt-2">
                      <Badge variant="primary" className="bg-emerald-50 text-emerald-800 border-emerald-200 flex items-center gap-1 text-[11px] w-fit">
                        <Briefcase className="h-3 w-3" />
                        <span>Related Drive: {ann.relatedDrive.company} - {ann.relatedDrive.title}</span>
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};

