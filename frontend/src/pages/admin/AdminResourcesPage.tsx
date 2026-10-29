import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  Search,
  Plus,
  RefreshCw,
  ExternalLink,
  Edit2,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  Layers,
} from 'lucide-react';
import { Card, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input, Textarea } from '../../components/common/FormControls';
import { Spinner } from '../../components/common/Spinner';
import { adminService } from '../../services/admin.service';
import { AdminLearningResourceItem, AdminPagination } from '../../types/admin.types';
import { useToast } from '../../context/ToastContext';

interface ResourceFormData {
  title: string;
  description: string;
  topic: string;
  relatedSkill: string;
  resourceUrl: string;
  resourceType: string;
  difficulty: string;
  estimatedDurationMinutes: number;
  publicationStatus: 'draft' | 'published' | 'archived';
  isFree: boolean;
  provider: string;
  isVerified: boolean;
}

export const AdminResourcesPage: React.FC = () => {
  const { success: toastSuccess, error: toastError } = useToast();

  const [resources, setResources] = useState<AdminLearningResourceItem[]>([]);
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
  const [topicFilter, setTopicFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Form Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ResourceFormData>({
    title: '',
    description: '',
    topic: 'React',
    relatedSkill: 'react',
    resourceUrl: 'https://',
    resourceType: 'Official Documentation',
    difficulty: 'All Levels',
    estimatedDurationMinutes: 60,
    publicationStatus: 'published',
    isFree: true,
    provider: 'Official Documentation',
    isVerified: true,
  });
  const [saving, setSaving] = useState(false);

  // Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState<AdminLearningResourceItem | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadResources = useCallback(
    async (pageToLoad = 1) => {
      setLoading(true);
      try {
        const data = await adminService.getLearningResources({
          page: pageToLoad,
          limit: 10,
          search: searchQuery.trim() || undefined,
          topic: topicFilter !== 'all' ? topicFilter : undefined,
          publicationStatus: statusFilter !== 'all' ? statusFilter : undefined,
        });
        setResources(data.resources);
        setPagination(data.pagination);
      } catch (err) {
        toastError('Failed to load learning resources', (err as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [searchQuery, topicFilter, statusFilter, toastError]
  );

  useEffect(() => {
    loadResources(1);
  }, [loadResources]);

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setFormData({
      title: '',
      description: '',
      topic: 'React',
      relatedSkill: 'react',
      resourceUrl: 'https://',
      resourceType: 'Official Documentation',
      difficulty: 'All Levels',
      estimatedDurationMinutes: 60,
      publicationStatus: 'published',
      isFree: true,
      provider: 'Official Core Team',
      isVerified: true,
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (res: AdminLearningResourceItem) => {
    setEditingId(res._id);
    setFormData({
      title: res.title,
      description: res.description,
      topic: res.topic,
      relatedSkill: res.relatedSkill,
      resourceUrl: res.resourceUrl,
      resourceType: res.resourceType,
      difficulty: res.difficulty,
      estimatedDurationMinutes: res.estimatedDurationMinutes,
      publicationStatus: res.publicationStatus,
      isFree: res.isFree,
      provider: res.provider,
      isVerified: res.isVerified,
    });
    setIsFormModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.resourceUrl.startsWith('http://') && !formData.resourceUrl.startsWith('https://')) {
      toastError('Invalid URL', 'Resource URL must start with http:// or https://');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        topic: formData.topic.trim(),
        relatedSkill: formData.relatedSkill.toLowerCase().trim(),
        resourceUrl: formData.resourceUrl.trim(),
        resourceType: formData.resourceType,
        difficulty: formData.difficulty,
        estimatedDurationMinutes: Number(formData.estimatedDurationMinutes) || 60,
        publicationStatus: formData.publicationStatus,
        isFree: formData.isFree,
        provider: formData.provider.trim(),
        isVerified: formData.isVerified,
      };

      if (editingId) {
        await adminService.updateLearningResource(editingId, payload);
        toastSuccess('Resource Updated', `Updated "${payload.title}".`);
      } else {
        await adminService.createLearningResource(payload);
        toastSuccess('Resource Created', `Added "${payload.title}" to learning catalog.`);
      }

      setIsFormModalOpen(false);
      loadResources(pagination.page);
    } catch (err) {
      toastError('Save Failed', (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminService.deleteLearningResource(deleteTarget._id);
      toastSuccess('Deleted', `Removed "${deleteTarget.title}" from catalog.`);
      setIsDeleteModalOpen(false);
      loadResources(pagination.page);
    } catch (err) {
      toastError('Delete Failed', (err as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Curated Learning Resources</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage verified official documentation, tutorials, and practice platforms linked in personalized roadmaps.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadResources(pagination.page)}
            className="flex items-center"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            <span>Refresh</span>
          </Button>

          <Button variant="primary" size="sm" onClick={handleOpenCreateModal} className="flex items-center">
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            <span>Add Resource</span>
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
              placeholder="Search resources by title, topic, provider..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Topics</option>
              <option value="react">React</option>
              <option value="typescript">TypeScript</option>
              <option value="javascript">JavaScript</option>
              <option value="nodejs">Node.js</option>
              <option value="python">Python</option>
              <option value="docker">Docker</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Resource Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center">
              <Spinner size="md" className="text-indigo-600 mb-2" />
              <p className="text-xs text-slate-500">Querying learning catalog...</p>
            </div>
          ) : resources.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200 tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Resource Title</th>
                    <th className="py-3 px-4">Topic / Skill</th>
                    <th className="py-3 px-4">Type & Difficulty</th>
                    <th className="py-3 px-4">Verification</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {resources.map((res) => (
                    <tr key={res._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 max-w-sm">
                        <div className="flex items-start space-x-2">
                          <div>
                            <a
                              href={res.resourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-bold text-slate-900 hover:text-indigo-600 flex items-center transition-colors"
                            >
                              <span>{res.title}</span>
                              <ExternalLink className="w-3 h-3 ml-1 text-slate-400 shrink-0" />
                            </a>
                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{res.description}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">By {res.provider}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-700">
                        <span className="font-semibold uppercase text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {res.topic}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        <p className="font-medium text-slate-800">{res.resourceType}</p>
                        <p className="text-[11px] text-slate-400">
                          {res.difficulty} • {res.estimatedDurationMinutes}m
                        </p>
                      </td>

                      <td className="py-3.5 px-4">
                        {res.isVerified ? (
                          <Badge variant="success" size="sm" className="flex items-center w-fit">
                            <ShieldCheck className="w-3 h-3 mr-1" />
                            <span>Verified</span>
                          </Badge>
                        ) : (
                          <Badge variant="neutral" size="sm">
                            Unverified
                          </Badge>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            res.publicationStatus === 'published'
                              ? 'success'
                              : res.publicationStatus === 'draft'
                              ? 'neutral'
                              : 'danger'
                          }
                          size="sm"
                        >
                          {res.publicationStatus}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        <button
                          onClick={() => handleOpenEditModal(res)}
                          title="Edit Resource"
                          className="p-1.5 rounded hover:bg-slate-200 text-slate-600 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            setDeleteTarget(res);
                            setIsDeleteModalOpen(true);
                          }}
                          title="Delete Resource"
                          className="p-1.5 rounded hover:bg-rose-100 text-rose-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 text-center text-slate-400">
              <BookOpen className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold text-slate-700">No learning resources found</p>
              <p className="text-xs text-slate-500 mt-1">Add a resource or reset your filters.</p>
            </div>
          )}

          {/* Pagination Toolbar */}
          {pagination.totalPages > 1 && (
            <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span>
                Page <span className="font-bold text-slate-700">{pagination.page}</span> of{' '}
                <span className="font-bold text-slate-700">{pagination.totalPages}</span> ({pagination.totalCount}{' '}
                resources)
              </span>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadResources(pagination.page - 1)}
                  disabled={!pagination.hasPrevPage || loading}
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                  <span>Previous</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadResources(pagination.page + 1)}
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

      {/* Resource Form Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingId ? 'Edit Learning Resource' : 'Add Curated Learning Resource'}
      >
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Resource Title</label>
            <Input
              type="text"
              required
              placeholder="e.g. React Official Interactive Quick Start"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Topic / Category</label>
              <Input
                type="text"
                required
                placeholder="e.g. React"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                className="text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Related Skill Key</label>
              <Input
                type="text"
                required
                placeholder="e.g. react"
                value={formData.relatedSkill}
                onChange={(e) => setFormData({ ...formData, relatedSkill: e.target.value })}
                className="text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Resource URL (Must begin with http:// or https://)
            </label>
            <Input
              type="url"
              required
              placeholder="https://react.dev/learn"
              value={formData.resourceUrl}
              onChange={(e) => setFormData({ ...formData, resourceUrl: e.target.value })}
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Type</label>
              <select
                value={formData.resourceType}
                onChange={(e) => setFormData({ ...formData, resourceType: e.target.value })}
                className="w-full text-xs rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-2xs"
              >
                <option value="Official Documentation">Documentation</option>
                <option value="Tutorial">Tutorial</option>
                <option value="Interactive Course">Interactive</option>
                <option value="Guide">Guide</option>
                <option value="Practice Platform">Practice</option>
                <option value="Cheat Sheet">Cheat Sheet</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Difficulty</label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                className="w-full text-xs rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-2xs"
              >
                <option value="All Levels">All Levels</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={formData.publicationStatus}
                onChange={(e) => setFormData({ ...formData, publicationStatus: e.target.value as 'draft' | 'published' | 'archived' })}
                className="w-full text-xs rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-2xs"
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Provider / Publisher</label>
              <Input
                type="text"
                required
                placeholder="e.g. Meta / React Team"
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                className="text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Est. Duration (Min)</label>
              <Input
                type="number"
                min={5}
                value={formData.estimatedDurationMinutes}
                onChange={(e) => setFormData({ ...formData, estimatedDurationMinutes: Number(e.target.value) })}
                className="text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Brief Description</label>
            <Textarea
              rows={2}
              required
              placeholder="Outline what students will master through this reference..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="text-xs"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center space-x-2 text-xs text-slate-700 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isVerified}
                onChange={(e) => setFormData({ ...formData, isVerified: e.target.checked })}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Mark as Verified Canonical Documentation</span>
            </label>

            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsFormModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={saving}>
                {saving ? 'Saving...' : editingId ? 'Update Resource' : 'Add to Catalog'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Deletion of Learning Resource"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Are you sure you want to remove <span className="font-bold text-slate-900">{deleteTarget?.title}</span> from
            the learning resources catalog?
          </p>

          <div className="flex items-center justify-end space-x-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete Resource'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
