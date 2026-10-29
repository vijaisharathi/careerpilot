import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Bell,
  Lock,
  User,
  Key,
  Database,
  Trash2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Input, Toggle } from '../components/common/FormControls';
import { Tabs } from '../components/common/Tabs';
import { Modal } from '../components/common/Modal';
import { useStudentData } from '../context/StudentDataContext';
import { useToast } from '../context/ToastContext';

export const SettingsPage: React.FC = () => {
  const { profile, updateProfile } = useStudentData();
  const { success, error, info } = useToast();

  const [activeTab, setActiveTab] = useState('profile');

  // Account details form
  const [accountForm, setAccountForm] = useState({
    name: profile.name,
    email: profile.email,
    phone: profile.phone,
    location: profile.location,
    github: profile.socials.github,
    linkedin: profile.socials.linkedin,
    leetcode: profile.socials.leetcode,
  });

  // Password Form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Notification Toggles
  const [notificationsSettings, setNotificationsSettings] = useState({
    emailInterviewAlerts: true,
    weeklyRoadmapDigest: true,
    newJobMatchAlerts: true,
    marketingUpdates: false,
  });

  // Delete modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: accountForm.name,
      email: accountForm.email,
      phone: accountForm.phone,
      location: accountForm.location,
      socials: {
        ...profile.socials,
        github: accountForm.github,
        linkedin: accountForm.linkedin,
        leetcode: accountForm.leetcode,
      },
    });
    success('Settings Saved', 'Account details and connected profiles updated.');
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      error('Password Error', 'Please complete all password fields.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      error('Mismatch', 'New passwords do not match.');
      return;
    }
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    success('Password Changed', 'Your security credentials have been updated.');
  };

  const handleExportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(profile, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `career_pilot_${profile.name.toLowerCase().replace(/\s+/g, '_')}_data.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    info('Data Exported', 'Your profile and application records downloaded as JSON.');
  };

  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Account & System Settings</h1>
          <Badge variant="neutral" size="sm">Preferences</Badge>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage your personal credentials, communication alerts, connected handles, and privacy.
        </p>
      </div>

      {/* Tabs */}
      <Tabs
        variant="line"
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: 'profile', label: 'Profile & Handles', icon: <User className="w-4 h-4" /> },
          { id: 'security', label: 'Password & Security', icon: <Lock className="w-4 h-4" /> },
          { id: 'notifications', label: 'Alert Preferences', icon: <Bell className="w-4 h-4" /> },
          { id: 'privacy', label: 'Data & Privacy', icon: <Database className="w-4 h-4" /> },
        ]}
      />

      {/* Tab 1: Profile & Handles */}
      {activeTab === 'profile' && (
        <Card className="shadow-2xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Personal Information & Handles</CardTitle>
            <CardDescription>Primary identification displayed to recruiters and mock interviewers.</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <form onSubmit={handleSaveAccount} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  value={accountForm.name}
                  onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                  required
                />
                <Input
                  label="Student Email Address"
                  type="email"
                  value={accountForm.email}
                  onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Phone Number"
                  value={accountForm.phone}
                  onChange={(e) => setAccountForm({ ...accountForm, phone: e.target.value })}
                />
                <Input
                  label="City & State"
                  value={accountForm.location}
                  onChange={(e) => setAccountForm({ ...accountForm, location: e.target.value })}
                />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-700 uppercase mb-3">Connected Developer Profiles</h4>
                <div className="space-y-3">
                  <Input
                    label="GitHub Profile URL"
                    value={accountForm.github}
                    onChange={(e) => setAccountForm({ ...accountForm, github: e.target.value })}
                  />
                  <Input
                    label="LinkedIn Profile URL"
                    value={accountForm.linkedin}
                    onChange={(e) => setAccountForm({ ...accountForm, linkedin: e.target.value })}
                  />
                  <Input
                    label="LeetCode Handle"
                    value={accountForm.leetcode}
                    onChange={(e) => setAccountForm({ ...accountForm, leetcode: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <Button type="submit" variant="primary" size="sm">
                  Save Account Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tab 2: Password & Security */}
      {activeTab === 'security' && (
        <Card className="shadow-2xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Password & Security</CardTitle>
            <CardDescription>Ensure your account uses a secure passphrase.</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
              <Input
                label="Current Password"
                type="password"
                placeholder="••••••••"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                required
              />
              <Input
                label="New Password (min 8 chars)"
                type="password"
                placeholder="••••••••"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                required
              />
              <Input
                label="Confirm New Password"
                type="password"
                placeholder="••••••••"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                required
              />

              <div className="pt-3">
                <Button type="submit" variant="primary" size="sm">
                  Update Password
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tab 3: Notifications */}
      {activeTab === 'notifications' && (
        <Card className="shadow-2xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Communication & Alert Preferences</CardTitle>
            <CardDescription>Configure frequency of email and browser alerts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-0">
            <Toggle
              label="Interview & Screening Reminders"
              description="Receive calendar notification 24 hours and 1 hour before scheduled rounds."
              checked={notificationsSettings.emailInterviewAlerts}
              onChange={(val) => setNotificationsSettings({ ...notificationsSettings, emailInterviewAlerts: val })}
            />

            <Toggle
              label="High-Match Opportunity Alerts"
              description="Send instant alert when a new campus or off-campus role exceeds 90% skill match."
              checked={notificationsSettings.newJobMatchAlerts}
              onChange={(val) => setNotificationsSettings({ ...notificationsSettings, newJobMatchAlerts: val })}
            />

            <Toggle
              label="Weekly Placement Velocity Digest"
              description="Summary of modules completed, application status shifts, and recommended actions."
              checked={notificationsSettings.weeklyRoadmapDigest}
              onChange={(val) => setNotificationsSettings({ ...notificationsSettings, weeklyRoadmapDigest: val })}
            />

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => success('Preferences Saved', 'Alert settings updated.')}
              >
                Save Preferences
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 4: Data & Privacy */}
      {activeTab === 'privacy' && (
        <Card className="shadow-2xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Data Retention & Account Management</CardTitle>
            <CardDescription>Export your portfolio data or manage account closure.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-0">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <strong className="text-slate-900 block text-sm">Download Portfolio Archive</strong>
                <p className="text-slate-500 mt-0.5">Export all verified competencies, roadmap milestones, and application logs as a JSON archive.</p>
              </div>
              <Button size="sm" variant="outline" onClick={handleExportData} className="shrink-0">
                Export Data
              </Button>
            </div>

            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <strong className="text-rose-900 block text-sm">Delete Student Account</strong>
                <p className="text-rose-700 mt-0.5">Permanently remove all profile details, mock interview logs, and resume drafts.</p>
              </div>
              <Button size="sm" variant="danger" onClick={() => setIsDeleteModalOpen(true)} className="shrink-0">
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Account Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Student Account"
        description="This action is irreversible and will erase all placement logs."
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Are you sure you want to delete your Career Pilot AI account? Your profile, tracked applications,
            and roadmap history will be permanently deleted.
          </p>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button size="sm" variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => {
                setIsDeleteModalOpen(false);
                info('Account Reset', 'Demo session reset to defaults.');
              }}
            >
              Confirm Deletion
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

