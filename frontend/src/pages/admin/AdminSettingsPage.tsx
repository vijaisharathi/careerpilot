import React, { useState, useEffect, useCallback } from 'react';
import {
  Settings,
  Globe,
  Briefcase,
  BookOpen,
  Bell,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Shield,
  Megaphone,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Spinner } from '../../components/common/Spinner';
import { adminService } from '../../services/admin.service';
import { AdminPlatformSettings } from '../../types/admin.types';
import { useToast } from '../../context/ToastContext';

export const AdminSettingsPage: React.FC = () => {
  const { success: toastSuccess, error: toastError } = useToast();

  const [settings, setSettings] = useState<AdminPlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Form state
  const [platformName, setPlatformName] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [systemNotice, setSystemNotice] = useState('');

  // Job Publication Rules
  const [requireAdminApproval, setRequireAdminApproval] = useState(true);
  const [autoArchiveExpiredDays, setAutoArchiveExpiredDays] = useState(30);
  const [allowStudentSubmissions, setAllowStudentSubmissions] = useState(false);

  // Learning Resource Visibility
  const [requireVerificationToPublish, setRequireVerificationToPublish] = useState(true);
  const [showFreeOnlyByDefault, setShowFreeOnlyByDefault] = useState(false);

  // Notification Preferences
  const [notifyOnNewRegistrations, setNotifyOnNewRegistrations] = useState(true);
  const [notifyOnJobApplicationSubmissions, setNotifyOnJobApplicationSubmissions] = useState(false);

  const populateForm = (data: AdminPlatformSettings) => {
    setSettings(data);
    setPlatformName(data.platformName || 'Career Pilot AI');
    setSupportEmail(data.supportEmail || 'support@careerpilot.ai');
    setSystemNotice(data.systemNotice || '');

    setRequireAdminApproval(data.jobPublicationRules?.requireAdminApproval ?? true);
    setAutoArchiveExpiredDays(data.jobPublicationRules?.autoArchiveExpiredDays ?? 30);
    setAllowStudentSubmissions(data.jobPublicationRules?.allowStudentSubmissions ?? false);

    setRequireVerificationToPublish(data.learningResourceVisibility?.requireVerificationToPublish ?? true);
    setShowFreeOnlyByDefault(data.learningResourceVisibility?.showFreeOnlyByDefault ?? false);

    setNotifyOnNewRegistrations(data.notificationPreferences?.notifyOnNewRegistrations ?? true);
    setNotifyOnJobApplicationSubmissions(data.notificationPreferences?.notifyOnJobApplicationSubmissions ?? false);

    setHasChanges(false);
  };

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminService.getSettings();
      populateForm(data);
    } catch (err) {
      toastError('Settings Error', (err as Error).message || 'Failed to load platform settings');
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleFieldChange = () => {
    setHasChanges(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload: Partial<AdminPlatformSettings> = {
        platformName,
        supportEmail,
        systemNotice,
        jobPublicationRules: {
          requireAdminApproval,
          autoArchiveExpiredDays: Number(autoArchiveExpiredDays),
          allowStudentSubmissions,
        },
        learningResourceVisibility: {
          requireVerificationToPublish,
          showFreeOnlyByDefault,
        },
        notificationPreferences: {
          notifyOnNewRegistrations,
          notifyOnJobApplicationSubmissions,
        },
      };

      const updated = await adminService.updateSettings(payload);
      populateForm(updated);
      toastSuccess('Platform Updated', 'Administrative platform settings saved successfully');
    } catch (err) {
      toastError('Save Failed', (err as Error).message || 'Failed to update platform settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (settings) {
      populateForm(settings);
    }
  };

  if (loading && !settings) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Spinner size="lg" className="text-indigo-600 mb-3" />
        <p className="text-xs font-medium text-slate-500">Loading platform configuration...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <Settings className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Platform Settings</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Configure system parameters, publication governance, resource policies, and administrative alerts.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={!hasChanges || saving}
            className="text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Reset
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="text-xs shadow-xs"
          >
            {saving ? (
              <>
                <Spinner size="sm" className="mr-1.5" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5 mr-1.5" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {hasChanges && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>You have unsaved configuration changes. Click &quot;Save Changes&quot; to apply them platform-wide.</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: General Platform Configuration */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Globe className="w-4 h-4 text-indigo-600" />
              <CardTitle className="text-base font-semibold text-slate-900">
                General Platform Settings
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-500">
              Platform identity displayed to students across dashboard emails, headers, and reports.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Platform Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={platformName}
                  onChange={(e) => {
                    setPlatformName(e.target.value);
                    handleFieldChange();
                  }}
                  placeholder="e.g. Career Pilot AI"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Support & Inquiries Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={supportEmail}
                  onChange={(e) => {
                    setSupportEmail(e.target.value);
                    handleFieldChange();
                  }}
                  placeholder="support@careerpilot.ai"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-1.5 mb-1">
                <Megaphone className="w-3.5 h-3.5 text-slate-500" />
                <label className="text-xs font-semibold text-slate-700">
                  Global System Notice / Broadcast Banner
                </label>
              </div>
              <textarea
                rows={2}
                value={systemNotice}
                onChange={(e) => {
                  setSystemNotice(e.target.value);
                  handleFieldChange();
                }}
                placeholder="Optional broadcast banner message visible to all students on login (e.g. Scheduled maintenance this Sunday at 2 AM UTC)..."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Leave empty if no global broadcast banner should be displayed.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Job & Internship Publication Rules */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Briefcase className="w-4 h-4 text-indigo-600" />
              <CardTitle className="text-base font-semibold text-slate-900">
                Job & Internship Publication Governance
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-500">
              Rules governing listing publication, student visibility, and expiration lifecycles.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <div className="flex items-start justify-between p-3.5 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <div className="text-xs font-semibold text-slate-800">
                  Require Administrative Approval for Publication
                </div>
                <p className="text-xs text-slate-500 mt-0.5 max-w-xl">
                  When enabled, all newly created or synchronized job postings start in &apos;draft&apos; status until an admin manually verifies and publishes them.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                <input
                  type="checkbox"
                  checked={requireAdminApproval}
                  onChange={(e) => {
                    setRequireAdminApproval(e.target.checked);
                    handleFieldChange();
                  }}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600" />
              </label>
            </div>

            <div className="flex items-start justify-between p-3.5 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <div className="text-xs font-semibold text-slate-800">
                  Allow Student Job Submissions
                </div>
                <p className="text-xs text-slate-500 mt-0.5 max-w-xl">
                  Allow verified students or campus ambassadors to submit job leads for administrator review and publication.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                <input
                  type="checkbox"
                  checked={allowStudentSubmissions}
                  onChange={(e) => {
                    setAllowStudentSubmissions(e.target.checked);
                    handleFieldChange();
                  }}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600" />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Auto-Archive Expired Postings (Days)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={autoArchiveExpiredDays}
                    onChange={(e) => {
                      setAutoArchiveExpiredDays(Number(e.target.value));
                      handleFieldChange();
                    }}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400">days</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Listings with application deadlines older than this threshold will be automatically marked archived.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Learning Resource Governance */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <CardTitle className="text-base font-semibold text-slate-900">
                Curated Learning Resource Visibility
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-500">
              Quality assurance parameters for recommended tutorials, documentation, and courses.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <div className="flex items-start justify-between p-3.5 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <div className="text-xs font-semibold text-slate-800">
                  Require Editorial Verification to Recommend
                </div>
                <p className="text-xs text-slate-500 mt-0.5 max-w-xl">
                  Only show resources marked &apos;isVerified: true&apos; inside student roadmap milestones to ensure URL safety and high content quality.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                <input
                  type="checkbox"
                  checked={requireVerificationToPublish}
                  onChange={(e) => {
                    setRequireVerificationToPublish(e.target.checked);
                    handleFieldChange();
                  }}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600" />
              </label>
            </div>

            <div className="flex items-start justify-between p-3.5 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <div className="text-xs font-semibold text-slate-800">
                  Default to Free Resources First
                </div>
                <p className="text-xs text-slate-500 mt-0.5 max-w-xl">
                  Prioritize free open-source guides, documentation, and YouTube courses before presenting paid certifications.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                <input
                  type="checkbox"
                  checked={showFreeOnlyByDefault}
                  onChange={(e) => {
                    setShowFreeOnlyByDefault(e.target.checked);
                    handleFieldChange();
                  }}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600" />
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Administrative Notifications & Alerts */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4 text-indigo-600" />
              <CardTitle className="text-base font-semibold text-slate-900">
                Administrative Notifications & Telemetry
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-500">
              Control administrative alert triggers and digest notifications.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <div className="flex items-start justify-between p-3.5 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <div className="text-xs font-semibold text-slate-800">
                  Notify on New Student Registrations
                </div>
                <p className="text-xs text-slate-500 mt-0.5 max-w-xl">
                  Generate administrative audit alerts when new students create platform accounts.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                <input
                  type="checkbox"
                  checked={notifyOnNewRegistrations}
                  onChange={(e) => {
                    setNotifyOnNewRegistrations(e.target.checked);
                    handleFieldChange();
                  }}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600" />
              </label>
            </div>

            <div className="flex items-start justify-between p-3.5 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <div className="text-xs font-semibold text-slate-800">
                  Notify on Student Job Applications
                </div>
                <p className="text-xs text-slate-500 mt-0.5 max-w-xl">
                  Send placement telemetry notifications whenever a student registers an application through the platform tracker.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                <input
                  type="checkbox"
                  checked={notifyOnJobApplicationSubmissions}
                  onChange={(e) => {
                    setNotifyOnJobApplicationSubmissions(e.target.checked);
                    handleFieldChange();
                  }}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600" />
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Footer Audit Metadata */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200">
          <div className="flex items-center space-x-1.5 mb-2 sm:mb-0">
            <Shield className="w-3.5 h-3.5 text-slate-400" />
            <span>Platform settings updates are recorded in the immutable administrative audit log.</span>
          </div>

          <div className="flex items-center space-x-3">
            {settings?.updatedAt && (
              <span>Last updated: {new Date(settings.updatedAt).toLocaleString()}</span>
            )}
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={saving || !hasChanges}
              className="text-xs"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

