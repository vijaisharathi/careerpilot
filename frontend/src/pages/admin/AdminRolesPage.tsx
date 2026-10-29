import React, { useState, useEffect, useCallback } from 'react';
import {
  Target,
  Plus,
  RefreshCw,
  Edit2,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input, Textarea } from '../../components/common/FormControls';
import { Spinner } from '../../components/common/Spinner';
import { adminService } from '../../services/admin.service';
import { AdminCareerRoleItem } from '../../types/admin.types';
import { useToast } from '../../context/ToastContext';

export const AdminRolesPage: React.FC = () => {
  const { success: toastSuccess, error: toastError } = useToast();

  const [roles, setRoles] = useState<AdminCareerRoleItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Modal
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    category: 'Software Engineering',
    description: '',
    marketDemand: 'High',
    growthOutlook: '+20% YoY',
    entrySalary: '$100,000 - $125,000',
    midSalary: '$140,000 - $180,000',
    skillsText: 'TypeScript:languages:Advanced, React:frameworks:Intermediate, Node.js:frameworks:Intermediate',
    isActive: true,
  });
  const [saving, setSaving] = useState(false);

  const loadRoles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getCareerRoles();
      setRoles(data);
    } catch (err) {
      toastError('Failed to load career roles', (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  const handleOpenCreateModal = () => {
    setEditingSlug(null);
    setFormData({
      title: '',
      slug: '',
      category: 'Software Engineering',
      description: '',
      marketDemand: 'High',
      growthOutlook: '+20% YoY',
      entrySalary: '$100,000 - $125,000',
      midSalary: '$140,000 - $180,000',
      skillsText: 'Python:languages:Advanced, Docker:cloud:Intermediate',
      isActive: true,
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (role: AdminCareerRoleItem) => {
    setEditingSlug(role.slug);
    const skillsFormatted = (role.requiredSkills || [])
      .map((s) => `${s.name}:${s.category || 'languages'}:${s.minProficiency || 'Intermediate'}`)
      .join(', ');

    setFormData({
      title: role.title,
      slug: role.slug,
      category: role.category,
      description: role.description,
      marketDemand: role.marketDemand || 'High',
      growthOutlook: role.growthOutlook || '+20% YoY',
      entrySalary: role.averageSalary?.entry || '$100,000',
      midSalary: role.averageSalary?.mid || '$150,000',
      skillsText: skillsFormatted,
      isActive: role.isActive,
    });
    setIsFormModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const parsedSkills = formData.skillsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((item) => {
          const parts = item.split(':').map((p) => p.trim());
          return {
            name: parts[0],
            category: parts[1] || 'languages',
            minProficiency: parts[2] || 'Intermediate',
            importance: 'critical',
            weight: 4,
          };
        });

      const payload = {
        title: formData.title.trim(),
        slug: formData.slug.trim() || undefined,
        category: formData.category.trim(),
        description: formData.description.trim(),
        marketDemand: formData.marketDemand,
        growthOutlook: formData.growthOutlook,
        averageSalary: {
          entry: formData.entrySalary,
          mid: formData.midSalary,
          currency: 'USD',
        },
        requiredSkills: parsedSkills,
        isActive: formData.isActive,
      };

      if (editingSlug) {
        await adminService.updateCareerRole(editingSlug, payload);
        toastSuccess('Role Updated', `Career role "${payload.title}" updated.`);
      } else {
        await adminService.createCareerRole(payload);
        toastSuccess('Role Created', `Added "${payload.title}" to canonical catalog.`);
      }

      setIsFormModalOpen(false);
      loadRoles();
    } catch (err) {
      toastError('Save Failed', (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (slug: string, roleTitle: string) => {
    try {
      const updated = await adminService.toggleCareerRoleStatus(slug);
      toastSuccess('Status Toggled', `Role "${roleTitle}" is now ${updated.isActive ? 'Active' : 'Inactive'}`);
      loadRoles();
    } catch (err) {
      toastError('Toggle Failed', (err as Error).message);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Canonical Career Role Catalog</h1>
          <p className="text-xs text-slate-500 mt-1">
            Maintain supported career roles, required competencies, and market benchmarks used across all student analyses.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <Button variant="outline" size="sm" onClick={loadRoles} className="flex items-center">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            <span>Refresh</span>
          </Button>

          <Button variant="primary" size="sm" onClick={handleOpenCreateModal} className="flex items-center">
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            <span>Add Career Role</span>
          </Button>
        </div>
      </div>

      {/* Role Catalog Grid */}
      {loading ? (
        <div className="py-24 text-center">
          <Spinner size="lg" className="text-indigo-600 mb-2" />
          <p className="text-xs text-slate-500">Querying canonical role catalog...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {roles.map((role) => (
            <Card key={role._id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-900">{role.title}</CardTitle>
                    <p className="text-[11px] font-medium text-indigo-600 mt-0.5">{role.category}</p>
                  </div>
                  <Badge variant={role.isActive ? 'success' : 'neutral'} size="sm">
                    {role.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <CardDescription className="text-xs text-slate-500 line-clamp-2 mt-2">
                  {role.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-0 space-y-3">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 font-semibold uppercase text-[10px] block">Market Demand</span>
                    <span className="font-bold text-slate-700">{role.marketDemand || 'High'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold uppercase text-[10px] block">Growth Outlook</span>
                    <span className="font-bold text-slate-700">{role.growthOutlook || '+15% YoY'}</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 font-semibold uppercase text-[10px] block mb-1">
                    Required Competencies ({role.requiredSkills?.length || 0})
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {(role.requiredSkills || []).slice(0, 4).map((sk, idx) => (
                      <Badge key={idx} variant="neutral" size="sm">
                        {sk.name}
                      </Badge>
                    ))}
                    {(role.requiredSkills?.length || 0) > 4 && (
                      <Badge variant="neutral" size="sm">
                        +{(role.requiredSkills?.length || 0) - 4} more
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => handleToggleStatus(role.slug, role.title)}
                    className={`text-xs font-semibold px-2 py-1 rounded transition-colors ${
                      role.isActive
                        ? 'text-slate-600 hover:bg-slate-100'
                        : 'text-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    {role.isActive ? 'Deactivate' : 'Activate'}
                  </button>

                  <button
                    onClick={() => handleOpenEditModal(role)}
                    className="flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    <Edit2 className="w-3 h-3 mr-1" />
                    <span>Edit Role</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Role Form Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingSlug ? 'Edit Canonical Career Role' : 'Create New Career Role'}
      >
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Role Title</label>
              <Input
                type="text"
                required
                placeholder="e.g. Platform Engineer"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Slug (Identifier)</label>
              <Input
                type="text"
                placeholder="e.g. platform-engineer"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <Input
                type="text"
                required
                placeholder="e.g. Cloud & DevOps"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Market Demand</label>
              <select
                value={formData.marketDemand}
                onChange={(e) => setFormData({ ...formData, marketDemand: e.target.value })}
                className="w-full text-xs rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-2xs"
              >
                <option value="Extremely High">Extremely High</option>
                <option value="High">High</option>
                <option value="Moderate">Moderate</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Role Description</label>
            <Textarea
              rows={3}
              required
              placeholder="Describe core engineering domain, responsibilities, and architectural scope..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Required Skills (Format: Name:Category:Proficiency, comma-separated)
            </label>
            <Input
              type="text"
              placeholder="e.g. Go:languages:Advanced, Kubernetes:cloud:Intermediate"
              value={formData.skillsText}
              onChange={(e) => setFormData({ ...formData, skillsText: e.target.value })}
              className="text-xs"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center space-x-2 text-xs text-slate-700 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Activate immediately for student career analysis</span>
            </label>

            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsFormModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={saving}>
                {saving ? 'Saving...' : editingSlug ? 'Update Role' : 'Create Role'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
