import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  Clock,
  Eye,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Terminal,
} from 'lucide-react';
import { Card, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Spinner } from '../../components/common/Spinner';
import { adminService } from '../../services/admin.service';
import { AdminAuditLogItem, AdminPagination } from '../../types/admin.types';
import { useToast } from '../../context/ToastContext';

export const AdminAuditLogsPage: React.FC = () => {
  const { error: toastError } = useToast();

  const [logs, setLogs] = useState<AdminAuditLogItem[]>([]);
  const [pagination, setPagination] = useState<AdminPagination>({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Metadata Inspection Modal State
  const [selectedLog, setSelectedLog] = useState<AdminAuditLogItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const loadAuditLogs = useCallback(
    async (pageToLoad = 1) => {
      setLoading(true);
      try {
        const data = await adminService.getAuditLogs({
          page: pageToLoad,
          limit: 20,
          search: searchQuery.trim() || undefined,
          eventType: eventTypeFilter !== 'all' ? eventTypeFilter : undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        });
        setLogs(data.logs);
        setPagination(data.pagination);
      } catch (err) {
        toastError('Failed to load audit logs', (err as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [searchQuery, eventTypeFilter, statusFilter, toastError]
  );

  useEffect(() => {
    loadAuditLogs(1);
  }, [loadAuditLogs]);

  const handleInspectMetadata = (log: AdminAuditLogItem) => {
    setSelectedLog(log);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Platform Activity & Security Audit Trail</h1>
          <p className="text-xs text-slate-500 mt-1">
            Immutable administrative event records for account modifications, job publishing, and catalog revisions.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => loadAuditLogs(pagination.page)}
          className="flex items-center"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          <span>Refresh Logs</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:space-x-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search actions, actor emails, target identifiers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={eventTypeFilter}
              onChange={(e) => setEventTypeFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Event Types</option>
              <option value="student_status_change">Student Status</option>
              <option value="admin_provisioned">Admin Provisioned</option>
              <option value="job_created">Job Created</option>
              <option value="job_updated">Job Updated</option>
              <option value="job_status_change">Job Status Change</option>
              <option value="career_role_created">Career Role Created</option>
              <option value="career_role_status_change">Role Status Change</option>
              <option value="learning_resource_created">Resource Created</option>
              <option value="settings_updated">Settings Updated</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Outcomes</option>
              <option value="success">Success</option>
              <option value="failure">Failure</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center">
              <Spinner size="md" className="text-indigo-600 mb-2" />
              <p className="text-xs text-slate-500">Querying security audit logs...</p>
            </div>
          ) : logs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200 tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Event Type</th>
                    <th className="py-3 px-4">Action Summary</th>
                    <th className="py-3 px-4">Administrator</th>
                    <th className="py-3 px-4">Client IP</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                          {log.eventType}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-800 font-medium max-w-sm">
                        <p className="truncate">{log.action}</p>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        <p className="font-semibold text-slate-900">{log.actorName}</p>
                        <p className="text-[10px] text-slate-400">{log.actorEmail}</p>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {log.ipAddress || '127.0.0.1'}
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge variant={log.status === 'success' ? 'success' : 'danger'} size="sm">
                          {log.status}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleInspectMetadata(log)}
                          title="Inspect Metadata"
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold inline-flex items-center space-x-1 transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 text-center text-slate-400">
              <ShieldCheck className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold text-slate-700">No audit events found</p>
              <p className="text-xs text-slate-500 mt-1">Try modifying your search or clearing filters.</p>
            </div>
          )}

          {/* Pagination Toolbar */}
          {pagination.totalPages > 1 && (
            <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span>
                Page <span className="font-bold text-slate-700">{pagination.page}</span> of{' '}
                <span className="font-bold text-slate-700">{pagination.totalPages}</span> ({pagination.totalCount}{' '}
                recorded events)
              </span>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadAuditLogs(pagination.page - 1)}
                  disabled={!pagination.hasPrevPage || loading}
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                  <span>Previous</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadAuditLogs(pagination.page + 1)}
                  disabled={!pagination.hasNextPage || loading}
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metadata Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Audit Event Details & Payload"
      >
        <div className="space-y-4 text-xs">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5 font-mono text-[11px]">
            <div>
              <span className="text-slate-400">Event ID:</span>{' '}
              <span className="text-slate-800 font-bold">{selectedLog?._id}</span>
            </div>
            <div>
              <span className="text-slate-400">Timestamp:</span>{' '}
              <span className="text-slate-800">{new Date(selectedLog?.createdAt || '').toISOString()}</span>
            </div>
            <div>
              <span className="text-slate-400">Actor:</span>{' '}
              <span className="text-slate-800">
                {selectedLog?.actorName} ({selectedLog?.actorEmail})
              </span>
            </div>
            <div>
              <span className="text-slate-400">Action:</span>{' '}
              <span className="text-indigo-700 font-bold">{selectedLog?.action}</span>
            </div>
            {selectedLog?.targetId && (
              <div>
                <span className="text-slate-400">Target:</span>{' '}
                <span className="text-slate-800">
                  {selectedLog.targetType} ({selectedLog.targetId})
                </span>
              </div>
            )}
            <div>
              <span className="text-slate-400">User Agent:</span>{' '}
              <span className="text-slate-600 truncate block">{selectedLog?.userAgent}</span>
            </div>
          </div>

          <div>
            <p className="font-semibold text-slate-700 mb-1.5 flex items-center">
              <Terminal className="w-3.5 h-3.5 mr-1 text-slate-500" />
              <span>Safe Event Metadata Payload</span>
            </p>
            <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg font-mono text-[11px] overflow-x-auto max-h-56">
              {JSON.stringify(selectedLog?.metadata || {}, null, 2)}
            </pre>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsDetailModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

