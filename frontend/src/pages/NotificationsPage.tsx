import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  Calendar,
  Briefcase,
  Map,
  CheckCheck,
  ArrowRight,
  Inbox,
  Clock,
  Trash2,
  RefreshCw,
  SlidersHorizontal,
  X,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Tabs } from '../components/common/Tabs';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../context/ToastContext';
import { notificationService } from '../services/notification.service';
import {
  INotificationItem,
  NotificationPreferences,
  NotificationType,
} from '../types/notification.types';

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error, info } = useToast();

  const [notifications, setNotifications] = useState<INotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Notification Preferences State
  const [showPreferencesModal, setShowPreferencesModal] = useState<boolean>(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    interviewReminders: true,
    followUpReminders: true,
    learningMilestones: true,
    roadmapTaskReminders: true,
    timeZone: 'UTC',
  });
  const [savingPrefs, setSavingPrefs] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [list, count, prefs] = await Promise.all([
        notificationService.getNotifications(),
        notificationService.getUnreadCount(),
        notificationService.getPreferences().catch(() => null),
      ]);
      setNotifications(list);
      setUnreadCount(count);
      if (prefs) {
        setPreferences(prefs);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load notifications.';
      error('Notification Error', msg);
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      success('Notification Updated', 'Item marked as read.');
    } catch {
      error('Update Error', 'Could not mark notification as read.');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await notificationService.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
      success('All Read', `Marked ${res.modifiedCount} notifications as read.`);
    } catch {
      error('Update Error', 'Could not mark all notifications as read.');
    }
  };

  const handleDismiss = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await notificationService.dismissNotification(id);
      const target = notifications.find((n) => n._id === id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (target && !target.read) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
      info('Notification Dismissed', 'Notification removed.');
    } catch {
      error('Dismissal Error', 'Could not dismiss notification.');
    }
  };

  const handleSyncReminders = async () => {
    setIsSyncing(true);
    try {
      const res = await notificationService.syncReminders();
      await loadData();
      if (res.createdCount > 0) {
        success('Reminders Refreshed', `Synchronized ${res.createdCount} new in-app alerts.`);
      } else {
        info('Reminders Up to Date', 'All interview and application reminders are current.');
      }
    } catch {
      error('Sync Error', 'Failed to synchronize reminder engine.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSavePreferences = async () => {
    setSavingPrefs(true);
    try {
      const updated = await notificationService.updatePreferences(preferences);
      setPreferences(updated);
      setShowPreferencesModal(false);
      success('Preferences Saved', 'In-app notification preferences updated.');
    } catch {
      error('Settings Error', 'Failed to save notification preferences.');
    } finally {
      setSavingPrefs(false);
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'interview':
        return <Calendar className="w-4 h-4 text-amber-600" />;
      case 'follow_up':
        return <Clock className="w-4 h-4 text-rose-600" />;
      case 'job_match':
        return <Briefcase className="w-4 h-4 text-emerald-600" />;
      case 'learning_milestone':
      case 'roadmap_task':
        return <Map className="w-4 h-4 text-indigo-600" />;
      case 'onboarding':
        return <Info className="w-4 h-4 text-sky-600" />;
      case 'system':
      default:
        return <Bell className="w-4 h-4 text-slate-600" />;
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !n.read;
    if (activeTab === 'interview') return n.type === 'interview';
    if (activeTab === 'follow_up') return n.type === 'follow_up';
    if (activeTab === 'roadmap') return n.type === 'roadmap_task' || n.type === 'learning_milestone';
    if (activeTab === 'system') return n.type === 'system' || n.type === 'onboarding';
    return true;
  });

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Notifications & In-App Alerts</h1>
            {unreadCount > 0 && <Badge variant="warning" size="sm">{unreadCount} Unread</Badge>}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time in-app alerts for upcoming interviews, follow-up deadlines, and curriculum tasks.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={handleSyncReminders}
            disabled={isSyncing}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />}
            className="text-xs"
          >
            {isSyncing ? 'Syncing...' : 'Sync Reminders'}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowPreferencesModal(true)}
            leftIcon={<SlidersHorizontal className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            Preferences
          </Button>

          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleMarkAllRead}
              leftIcon={<CheckCheck className="w-3.5 h-3.5" />}
              className="text-xs border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100/60"
            >
              Mark All as Read
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        variant="pills"
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: 'all', label: 'All Alerts', badge: notifications.length },
          { id: 'unread', label: 'Unread', badge: unreadCount > 0 ? unreadCount : undefined },
          { id: 'interview', label: 'Interviews' },
          { id: 'follow_up', label: 'Follow-ups' },
          { id: 'roadmap', label: 'Roadmap & Tasks' },
          { id: 'system', label: 'System' },
        ]}
      />

      {/* Notifications List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-5 rounded-2xl border border-slate-200 bg-white animate-pulse space-y-2">
              <div className="h-4 bg-slate-200 rounded w-1/3" />
              <div className="h-3 bg-slate-100 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <EmptyState
          icon={<Inbox className="w-8 h-8 text-indigo-400" />}
          title="All Caught Up!"
          description="You have no notifications matching this category. Click below to scan active deadlines."
          actionText="Sync Active Reminders"
          onAction={handleSyncReminders}
        />
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notif) => (
            <Card
              key={notif._id}
              className={`shadow-2xs transition-all ${
                notif.read ? 'bg-white opacity-85' : 'bg-indigo-50/20 border-indigo-200 shadow-xs'
              }`}
            >
              <CardContent className="pt-4 pb-4 sm:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 shrink-0 mt-0.5 shadow-2xs">
                      {getNotificationIcon(notif.type)}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-xs sm:text-sm text-slate-900">{notif.title}</h3>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                        )}
                        <Badge
                          variant={
                            notif.type === 'interview'
                              ? 'warning'
                              : notif.type === 'follow_up'
                              ? 'danger'
                              : notif.type === 'roadmap_task'
                              ? 'info'
                              : 'neutral'
                          }
                          size="sm"
                        >
                          {notif.type.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{notif.message}</p>
                      <div className="text-[11px] text-slate-400 font-medium pt-0.5">
                        {new Date(notif.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!notif.read && (
                      <button
                        type="button"
                        onClick={(e) => handleMarkAsRead(notif._id, e)}
                        className="text-xs text-slate-400 hover:text-indigo-600 transition-colors p-1"
                        title="Mark read"
                        aria-label="Mark notification as read"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => handleDismiss(notif._id, e)}
                      className="text-xs text-slate-300 hover:text-rose-600 transition-colors p-1"
                      title="Dismiss notification"
                      aria-label="Dismiss notification"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {notif.actionUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (!notif.read) {
                            handleMarkAsRead(notif._id);
                          }
                          navigate(notif.actionUrl!);
                        }}
                        className="text-xs py-1"
                        rightIcon={<ArrowRight className="w-3 h-3" />}
                      >
                        View
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Notification Preferences Modal */}
      {showPreferencesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">In-App Notification Preferences</h3>
                <p className="text-xs text-slate-500 mt-0.5">Configure in-app alert triggers for placement deadlines</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPreferencesModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                <div>
                  <div className="text-xs font-semibold text-slate-900">Interview Reminders</div>
                  <div className="text-[11px] text-slate-500">Alert for interviews scheduled within 48 hours</div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.interviewReminders}
                  onChange={(e) =>
                    setPreferences({ ...preferences, interviewReminders: e.target.checked })
                  }
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                <div>
                  <div className="text-xs font-semibold text-slate-900">Follow-up Reminders</div>
                  <div className="text-[11px] text-slate-500">Alert for pending application follow-up dates</div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.followUpReminders}
                  onChange={(e) =>
                    setPreferences({ ...preferences, followUpReminders: e.target.checked })
                  }
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                <div>
                  <div className="text-xs font-semibold text-slate-900">Learning Milestones</div>
                  <div className="text-[11px] text-slate-500">Celebrate 25%, 50%, 75%, and 100% roadmap progress</div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.learningMilestones}
                  onChange={(e) =>
                    setPreferences({ ...preferences, learningMilestones: e.target.checked })
                  }
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                <div>
                  <div className="text-xs font-semibold text-slate-900">Next Roadmap Task</div>
                  <div className="text-[11px] text-slate-500">Prompt for next uncompleted curriculum task</div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.roadmapTaskReminders}
                  onChange={(e) =>
                    setPreferences({ ...preferences, roadmapTaskReminders: e.target.checked })
                  }
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Timezone Context
                </label>
                <select
                  value={preferences.timeZone}
                  onChange={(e) => setPreferences({ ...preferences, timeZone: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="UTC">UTC (Universal Coordinated Time)</option>
                  <option value="Asia/Kolkata">Asia/Kolkata (IST - +05:30)</option>
                  <option value="America/New_York">America/New_York (EST - -05:00)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (PST - -08:00)</option>
                  <option value="Europe/London">Europe/London (GMT - +00:00)</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Alerts are strictly delivered in-app within the Career Pilot interface. External email or push notifications are not configured for this demo environment.
                </span>
              </div>
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowPreferencesModal(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={handleSavePreferences}
                disabled={savingPrefs}
                className="text-xs"
              >
                {savingPrefs ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
