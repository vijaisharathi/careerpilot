import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  Plus,
  Calendar,
  Building2,
  Users,
  Briefcase,
  AlertCircle,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input, Select, Textarea } from '../../components/common/FormControls';
import { Spinner } from '../../components/common/Spinner';
import { placementService } from '../../services/placement.service';
import { PlacementAnnouncementItem, PlacementDriveItem } from '../../types/placement.types';
import { useToast } from '../../context/ToastContext';

export const PlacementAnnouncementsPage: React.FC = () => {
  const { success: toastSuccess, error: toastError } = useToast();

  const [announcements, setAnnouncements] = useState<PlacementAnnouncementItem[]>([]);
  const [drives, setDrives] = useState<PlacementDriveItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    relatedDriveId: '',
    targetDepartments: '',
    targetGraduationYears: '2026',
    expirationDate: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [annData, driveRes] = await Promise.all([
        placementService.getAnnouncements(),
        placementService.getDrives({ limit: 50 }),
      ]);
      setAnnouncements(annData);
      setDrives(driveRes.drives);
    } catch (err) {
      toastError('Failed to load announcements', (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      toastError('Validation Error', 'Title and content are required.');
      return;
    }

    try {
      setSubmitting(true);
      const payload: Partial<PlacementAnnouncementItem> = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        relatedDrive: formData.relatedDriveId
          ? ({ id: formData.relatedDriveId } as any)
          : undefined,
        targetDepartments: formData.targetDepartments
          ? formData.targetDepartments.split(',').map((d) => d.trim()).filter(Boolean)
          : [],
        targetGraduationYears: formData.targetGraduationYears
          ? formData.targetGraduationYears
              .split(',')
              .map((y) => parseInt(y.trim(), 10))
              .filter((y) => !isNaN(y))
          : [],
        expirationDate: formData.expirationDate || undefined,
      };

      await placementService.createAnnouncement(payload);
      toastSuccess('Published', 'Placement announcement published and notified to target students.');
      setIsModalOpen(false);
      setFormData({
        title: '',
        content: '',
        relatedDriveId: '',
        targetDepartments: '',
        targetGraduationYears: '2026',
        expirationDate: '',
      });
      loadData();
    } catch (err) {
      toastError('Publish Failed', (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Placement Announcements & Circulars
            </h1>
            <Badge variant="primary" className="bg-emerald-50 text-emerald-700 border-emerald-200">
              Campus Broadcast
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Publish recruitment notices, schedule updates, and preparation guidelines targeted by department and batch.
          </p>
        </div>
        <div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Plus className="h-4 w-4" />
            <span>New Announcement</span>
          </Button>
        </div>
      </div>

      {/* Announcements List */}
      <Card className="border border-slate-200/80 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-200/80 py-3.5 px-6">
          <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Bell className="h-4 w-4 text-emerald-600" />
            <span>Published Circulars ({announcements.length})</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Spinner size="lg" className="text-emerald-600 mb-3" />
              <p className="text-xs font-medium text-slate-500">Loading campus announcements...</p>
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Bell className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <h3 className="text-sm font-semibold text-slate-900">No announcements published</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Keep your students informed about campus drives, test schedules, and mock interview workshops.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsModalOpen(true)}
                className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Publish First Circular
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {announcements.map((ann) => (
                <div key={ann.id} className="p-6 hover:bg-slate-50/60 transition-colors space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h3 className="font-bold text-base text-slate-900">{ann.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{new Date(ann.publicationDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">
                    {ann.content}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
                    {ann.relatedDrive && (
                      <Badge variant="primary" className="bg-emerald-50 text-emerald-800 border-emerald-200 flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />
                        <span>{ann.relatedDrive.company} - {ann.relatedDrive.title}</span>
                      </Badge>
                    )}

                    <span className="text-slate-500">
                      <strong>Depts:</strong>{' '}
                      {ann.targetDepartments.length > 0 ? ann.targetDepartments.join(', ') : 'All Departments'}
                    </span>

                    <span className="text-slate-500">
                      <strong>Batches:</strong>{' '}
                      {ann.targetGraduationYears.length > 0 ? ann.targetGraduationYears.join(', ') : 'All Batches'}
                    </span>

                    {ann.expirationDate && (
                      <span className="text-amber-700 text-[11px]">
                        Expires: {new Date(ann.expirationDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Announcement Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Publish Campus Placement Announcement"
        size="md"
      >
        <form onSubmit={handleCreateAnnouncement} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Circular Title *
            </label>
            <Input
              placeholder="e.g. Google India Campus Recruitment Assessment Details"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Link to Recruitment Drive (Optional)
            </label>
            <Select
              value={formData.relatedDriveId}
              onChange={(e) => setFormData({ ...formData, relatedDriveId: e.target.value })}
              className="text-xs"
            >
              <option value="">-- General Announcement (No specific drive) --</option>
              {drives.map((d) => {
                const dId = d._id || d.id || '';
                return (
                  <option key={dId} value={dId}>
                    {d.companyName} - {d.driveTitle}
                  </option>
                );
              })}
            </Select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Target Departments (Optional, comma-separated)
            </label>
            <Input
              placeholder="Leave blank for all, or: Computer Science, Information Technology"
              value={formData.targetDepartments}
              onChange={(e) => setFormData({ ...formData, targetDepartments: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Graduation Years
              </label>
              <Input
                placeholder="e.g. 2026, 2027"
                value={formData.targetGraduationYears}
                onChange={(e) => setFormData({ ...formData, targetGraduationYears: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Expiration Date (Optional)
              </label>
              <Input
                type="date"
                value={formData.expirationDate}
                onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Announcement Content / Instructions *
            </label>
            <Textarea
              rows={4}
              placeholder="Detailed instructions for eligible students..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={submitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {submitting ? <Spinner size="sm" className="mr-1.5" /> : null}
              Broadcast Circular
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

