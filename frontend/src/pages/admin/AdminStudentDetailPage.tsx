import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  GraduationCap,
  Compass,
  Map,
  Briefcase,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
  ShieldAlert,
  UserCheck,
  UserX,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Textarea } from '../../components/common/FormControls';
import { Spinner } from '../../components/common/Spinner';
import { adminService } from '../../services/admin.service';
import { AdminStudentDetail } from '../../types/admin.types';
import { useToast } from '../../context/ToastContext';

export const AdminStudentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();

  const [student, setStudent] = useState<AdminStudentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Status Change Modal
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<'active' | 'suspended'>('suspended');
  const [statusReason, setStatusReason] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadStudent = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await adminService.getStudentDetail(id);
      setStudent(data);
    } catch (err) {
      toastError('Error', (err as Error).message || 'Failed to retrieve student dossier');
    } finally {
      setLoading(false);
    }
  }, [id, toastError]);

  useEffect(() => {
    loadStudent();
  }, [loadStudent]);

  const handleOpenStatusModal = (newStatus: 'active' | 'suspended') => {
    setTargetStatus(newStatus);
    setStatusReason('');
    setIsStatusModalOpen(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!student) return;
    setUpdatingStatus(true);
    try {
      await adminService.updateStudentStatus(student.id, targetStatus, statusReason);
      toastSuccess('Status Updated', `Student status changed to ${targetStatus}`);
      setIsStatusModalOpen(false);
      loadStudent();
    } catch (err) {
      toastError('Update Failed', (err as Error).message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Spinner size="lg" className="text-indigo-600 mb-3" />
        <p className="text-xs font-medium text-slate-500">Retrieving student placement dossier...</p>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="py-16 text-center text-slate-500 max-w-lg mx-auto">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-base font-bold text-slate-800">Student Profile Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">The requested student ID does not correspond to an active account.</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/admin/students')} className="mt-4">
          Return to Student Directory
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/admin/students')}
          className="flex items-center text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          <span>Back to Students Directory</span>
        </button>

        <div className="flex items-center space-x-2">
          {student.status === 'active' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenStatusModal('suspended')}
              className="text-rose-600 hover:bg-rose-50 border-rose-200 text-xs flex items-center"
            >
              <UserX className="w-3.5 h-3.5 mr-1" />
              <span>Suspend Account</span>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenStatusModal('active')}
              className="text-emerald-600 hover:bg-emerald-50 border-emerald-200 text-xs flex items-center"
            >
              <UserCheck className="w-3.5 h-3.5 mr-1" />
              <span>Activate Account</span>
            </Button>
          )}
        </div>
      </div>

      {/* Header Profile Card */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-full bg-indigo-100 text-indigo-700 font-black text-xl flex items-center justify-center border-2 border-indigo-200">
              {student.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="text-lg font-bold text-slate-900">{student.name}</h1>
                <Badge variant={student.status === 'active' ? 'success' : 'danger'} size="sm">
                  {student.status === 'active' ? 'Active Account' : 'Suspended'}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{student.email}</p>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center space-x-3">
                <span>Registered: {new Date(student.createdAt).toLocaleDateString()}</span>
                {student.lastLoginAt && <span>• Last Active: {new Date(student.lastLoginAt).toLocaleDateString()}</span>}
              </p>
            </div>
          </div>

          <div className="text-right sm:border-l sm:border-slate-200 sm:pl-6">
            <p className="text-[10px] uppercase font-bold text-slate-400">Profile Completion</p>
            <p className="text-2xl font-black text-indigo-600">{student.profile?.completionPercentage ?? 0}%</p>
            <p className="text-[11px] text-slate-500">
              {student.profile?.skills.length ?? 0} Skills • {student.profile?.projectsCount ?? 0} Projects
            </p>
          </div>
        </div>
      </Card>

      {/* Grid: Academic Details & Career Fit */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Academic Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center">
              <GraduationCap className="w-4 h-4 mr-2 text-indigo-600" />
              <span>Academic & Portfolio Background</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0 text-xs">
            <div>
              <p className="font-semibold text-slate-500 uppercase text-[10px]">Institution</p>
              <p className="font-bold text-slate-800 text-sm mt-0.5">{student.profile?.college || 'Not specified'}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <p className="font-semibold text-slate-500 uppercase text-[10px]">Degree / Branch</p>
                <p className="text-slate-800 font-medium">{student.profile?.department || 'General'}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-500 uppercase text-[10px]">Graduation Year</p>
                <p className="text-slate-800 font-medium">{student.profile?.graduationYear || 'N/A'}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <p className="font-semibold text-slate-500 uppercase text-[10px] mb-1.5">Registered Skills</p>
              {student.profile?.skills && student.profile.skills.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {student.profile.skills.map((sk, idx) => (
                    <Badge key={idx} variant="neutral" size="sm">
                      {sk.name} ({sk.level})
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 italic">No skills listed yet.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Career Readiness */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center">
              <Compass className="w-4 h-4 mr-2 text-amber-600" />
              <span>Career Fit & Readiness Audit</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0 text-xs">
            {student.careerReadiness ? (
              <>
                <div>
                  <p className="font-semibold text-slate-500 uppercase text-[10px]">Target Career Track</p>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">{student.careerReadiness.targetRole}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg text-center">
                    <p className="text-[10px] uppercase font-bold text-amber-700">Readiness Score</p>
                    <p className="text-xl font-black text-amber-900 mt-0.5">{student.careerReadiness.readinessScore}%</p>
                  </div>
                  <div className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-lg text-center">
                    <p className="text-[10px] uppercase font-bold text-indigo-700">Skill Match</p>
                    <p className="text-xl font-black text-indigo-900 mt-0.5">{student.careerReadiness.skillMatchScore}%</p>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400">
                  Last audited: {new Date(student.careerReadiness.analyzedAt || '').toLocaleDateString()}
                </p>
              </>
            ) : (
              <div className="py-6 text-center text-slate-400">
                <Compass className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="font-semibold text-slate-700">No Career Analysis Run Yet</p>
                <p className="text-[11px] text-slate-400 mt-1">Student has not executed a target role fit audit.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Grid: Roadmap & Placement Pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Roadmap Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center">
              <Map className="w-4 h-4 mr-2 text-purple-600" />
              <span>Learning Roadmap Execution</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0 text-xs">
            {student.roadmapProgress ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">{student.roadmapProgress.targetRole}</span>
                  <Badge variant="info" size="sm">
                    {student.roadmapProgress.overallProgress}% Complete
                  </Badge>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{ width: `${student.roadmapProgress.overallProgress}%` }}
                  />
                </div>

                <p className="text-[11px] text-slate-500">
                  {student.roadmapProgress.completedTasks} of {student.roadmapProgress.totalTasks} structured learning tasks completed.
                </p>
              </>
            ) : (
              <p className="text-slate-400 italic py-4 text-center">No personalized roadmap generated yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Placement Pipeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center">
              <Briefcase className="w-4 h-4 mr-2 text-emerald-600" />
              <span>Placement Applications Tracker</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Active Applications Pipeline:</span>
              <span className="font-bold text-slate-900 text-sm">
                {student.placementTracker?.activeApplications ?? 0}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div className="p-2 rounded bg-slate-100 text-slate-700">
                <p className="text-[10px] uppercase font-bold text-slate-400">Applied</p>
                <p className="font-bold text-sm mt-0.5">{student.placementTracker?.stageBreakdown.applied ?? 0}</p>
              </div>
              <div className="p-2 rounded bg-indigo-50 text-indigo-700">
                <p className="text-[10px] uppercase font-bold text-indigo-400">Interview</p>
                <p className="font-bold text-sm mt-0.5">{student.placementTracker?.stageBreakdown.interview ?? 0}</p>
              </div>
              <div className="p-2 rounded bg-emerald-50 text-emerald-700">
                <p className="text-[10px] uppercase font-bold text-emerald-400">Offer</p>
                <p className="font-bold text-sm mt-0.5">{student.placementTracker?.stageBreakdown.offer ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Account Status Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title={targetStatus === 'suspended' ? 'Suspend Student Account' : 'Reactivate Student Account'}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Confirm transitioning <span className="font-bold">{student.name}</span> to{' '}
            <span className="font-bold uppercase">{targetStatus}</span> status.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Administrative Note</label>
            <Textarea
              rows={3}
              placeholder="Reason for suspension or activation..."
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
              className="text-xs"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsStatusModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={targetStatus === 'suspended' ? 'danger' : 'primary'}
              size="sm"
              onClick={handleConfirmStatusChange}
              disabled={updatingStatus}
            >
              {updatingStatus ? 'Updating...' : `Confirm ${targetStatus}`}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
