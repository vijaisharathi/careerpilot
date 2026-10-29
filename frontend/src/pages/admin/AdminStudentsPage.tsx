import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  ShieldAlert,
  UserCheck,
  UserX,
  ExternalLink,
  Plus,
  RefreshCw,
  Clock,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input, Select, Textarea } from '../../components/common/FormControls';
import { Spinner } from '../../components/common/Spinner';
import { adminService } from '../../services/admin.service';
import { AdminStudentSummary, AdminPagination } from '../../types/admin.types';
import { useToast } from '../../context/ToastContext';

export const AdminStudentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();

  const [students, setStudents] = useState<AdminStudentSummary[]>([]);
  const [pagination, setPagination] = useState<AdminPagination>({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [gradYearFilter, setGradYearFilter] = useState<number | undefined>(undefined);

  // Status Change Modal State
  const [selectedStudent, setSelectedStudent] = useState<AdminStudentSummary | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<'active' | 'suspended'>('suspended');
  const [statusReason, setStatusReason] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Provision Admin Modal State
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [provisionName, setProvisionName] = useState('');
  const [provisionEmail, setProvisionEmail] = useState('');
  const [provisionPassword, setProvisionPassword] = useState('');
  const [provisioning, setProvisioning] = useState(false);

  const loadStudents = useCallback(
    async (pageToLoad = 1) => {
      setLoading(true);
      try {
        const data = await adminService.getStudents({
          page: pageToLoad,
          limit: 10,
          search: searchQuery.trim() || undefined,
          status: statusFilter,
          department: departmentFilter !== 'all' ? departmentFilter : undefined,
          graduationYear: gradYearFilter,
        });
        setStudents(data.students);
        setPagination(data.pagination);
      } catch (err) {
        toastError('Failed to load students', (err as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [searchQuery, statusFilter, departmentFilter, gradYearFilter, toastError]
  );

  useEffect(() => {
    loadStudents(1);
  }, [loadStudents]);

  const handleOpenStatusModal = (student: AdminStudentSummary, newStatus: 'active' | 'suspended') => {
    setSelectedStudent(student);
    setTargetStatus(newStatus);
    setStatusReason('');
    setIsStatusModalOpen(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!selectedStudent) return;
    setUpdatingStatus(true);
    try {
      await adminService.updateStudentStatus(selectedStudent.id, targetStatus, statusReason);
      toastSuccess(
        'Account Updated',
        `Student account for ${selectedStudent.name} is now ${targetStatus}.`
      );
      setIsStatusModalOpen(false);
      loadStudents(pagination.page);
    } catch (err) {
      toastError('Update Failed', (err as Error).message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleProvisionAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!provisionName || !provisionEmail || !provisionPassword) {
      toastError('Missing Fields', 'Please complete all fields.');
      return;
    }
    setProvisioning(true);
    try {
      await adminService.provisionAdmin({
        name: provisionName,
        email: provisionEmail,
        password: provisionPassword,
      });
      toastSuccess('Admin Provisioned', `New administrator account created for ${provisionEmail}`);
      setIsProvisionModalOpen(false);
      setProvisionName('');
      setProvisionEmail('');
      setProvisionPassword('');
    } catch (err) {
      toastError('Provisioning Failed', (err as Error).message);
    } finally {
      setProvisioning(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Student Account Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Review registered student profiles, evaluate placement progress, and manage account statuses.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadStudents(pagination.page)}
            className="flex items-center"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            <span>Refresh</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsProvisionModalOpen(true)}
            className="flex items-center"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            <span>Provision Administrator</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:space-x-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search students by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="suspended">Suspended Only</option>
            </select>

            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Departments</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Information Technology">Information Tech</option>
              <option value="Electrical Engineering">Electrical Engg</option>
            </select>

            <select
              value={gradYearFilter || ''}
              onChange={(e) => setGradYearFilter(e.target.value ? Number(e.target.value) : undefined)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Grad Year (All)</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
              <option value="2028">2028</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Student Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center">
              <Spinner size="md" className="text-indigo-600 mb-2" />
              <p className="text-xs text-slate-500">Querying student records...</p>
            </div>
          ) : students.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200 tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Academic Details</th>
                    <th className="py-3 px-4">Profile Status</th>
                    <th className="py-3 px-4">Account Status</th>
                    <th className="py-3 px-4">Registered Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-bold text-slate-900">{st.name}</p>
                          <p className="text-[11px] text-slate-500">{st.email}</p>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        {st.profile?.college ? (
                          <div>
                            <p className="font-medium text-slate-800">{st.profile.college}</p>
                            <p className="text-[11px] text-slate-500">
                              {st.profile.department || 'General'} • Class of {st.profile.graduationYear || 'N/A'}
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No college details provided</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-slate-800">
                            {st.profile?.completionPercentage ?? 0}%
                          </span>
                          <span className="text-[11px] text-slate-400">
                            ({st.profile?.skillsCount ?? 0} skills, {st.profile?.projectsCount ?? 0} projects)
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge variant={st.status === 'active' ? 'success' : 'danger'} size="sm">
                          {st.status === 'active' ? 'Active' : 'Suspended'}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(st.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => navigate(`/admin/students/${st.id}`)}
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                        >
                          View Dossier
                        </button>

                        {st.status === 'active' ? (
                          <button
                            onClick={() => handleOpenStatusModal(st, 'suspended')}
                            className="px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors"
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenStatusModal(st, 'active')}
                            className="px-2.5 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold transition-colors"
                          >
                            Activate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 text-center text-slate-400">
              <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold text-slate-700">No students found matching your criteria</p>
              <p className="text-xs text-slate-500 mt-1">Try broadening your search term or clearing filters.</p>
            </div>
          )}

          {/* Pagination Toolbar */}
          {pagination.totalPages > 1 && (
            <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span>
                Showing page <span className="font-bold text-slate-700">{pagination.page}</span> of{' '}
                <span className="font-bold text-slate-700">{pagination.totalPages}</span> (
                {pagination.totalCount} total students)
              </span>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadStudents(pagination.page - 1)}
                  disabled={!pagination.hasPrevPage || loading}
                  className="flex items-center"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                  <span>Previous</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadStudents(pagination.page + 1)}
                  disabled={!pagination.hasNextPage || loading}
                  className="flex items-center"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Status Change Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title={targetStatus === 'suspended' ? 'Suspend Student Account' : 'Reactivate Student Account'}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            You are about to transition <span className="font-bold text-slate-900">{selectedStudent?.name}</span> (
            {selectedStudent?.email}) to <span className="font-bold uppercase">{targetStatus}</span> status.
          </p>

          {targetStatus === 'suspended' && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Suspended students will immediately lose access to their learning roadmap, resume builder, and mock
                interviews, and will be blocked from logging in.
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Administrative Reason Note</label>
            <Textarea
              rows={3}
              placeholder="e.g. Verified academic leave, misconduct audit, or student request..."
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
              {updatingStatus ? 'Updating...' : `Confirm ${targetStatus === 'suspended' ? 'Suspension' : 'Activation'}`}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Provision Admin Modal */}
      <Modal
        isOpen={isProvisionModalOpen}
        onClose={() => setIsProvisionModalOpen(false)}
        title="Provision New Administrator Account"
      >
        <form onSubmit={handleProvisionAdmin} className="space-y-3.5">
          <p className="text-xs text-slate-500">
            Administrative accounts have unrestricted platform access to oversee all students, modify catalog roles,
            and review audit logs.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
            <Input
              type="text"
              required
              placeholder="e.g. Dr. Ramesh Kumar"
              value={provisionName}
              onChange={(e) => setProvisionName(e.target.value)}
              className="text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Official Email Address</label>
            <Input
              type="email"
              required
              placeholder="e.g. ramesh.kumar@placement.edu"
              value={provisionEmail}
              onChange={(e) => setProvisionEmail(e.target.value)}
              className="text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Temporary Master Password</label>
            <Input
              type="password"
              required
              minLength={8}
              placeholder="Minimum 8 characters"
              value={provisionPassword}
              onChange={(e) => setProvisionPassword(e.target.value)}
              className="text-xs"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsProvisionModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={provisioning}>
              {provisioning ? 'Provisioning...' : 'Provision Administrator'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

