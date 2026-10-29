import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Menu, Bell, Sparkles, User, Settings, LogOut, Search } from 'lucide-react';
import { useStudentData } from '../../context/StudentDataContext';
import { useAuth } from '../../context/AuthContext';
import { Dropdown } from '../common/Dropdown';
import { Button } from '../common/Button';
import { notificationService } from '../../services/notification.service';

export interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { profile, notifications } = useStudentData();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [liveUnreadCount, setLiveUnreadCount] = useState<number>(0);

  useEffect(() => {
    notificationService
      .getUnreadCount()
      .then((count) => setLiveUnreadCount(count))
      .catch(() => setLiveUnreadCount(notifications.filter((n) => !n.read).length));
  }, [location.pathname, notifications]);

  const displayUnread = liveUnreadCount > 0 ? liveUnreadCount : notifications.filter((n) => !n.read).length;

  // Derive title from pathname
  const routeTitles: Record<string, { title: string; subtitle?: string }> = {
    '/dashboard': { title: 'Student Dashboard', subtitle: 'Placement Season Overview' },
    '/profile': { title: 'Profile & Skills', subtitle: 'Manage Competencies & Education' },
    '/career-analysis': { title: 'Career Fit Analysis', subtitle: 'Market Benchmarks & Matching' },
    '/skill-gap': { title: 'Skill Gap Matrix', subtitle: 'Identify High-Priority Deficits' },
    '/roadmap': { title: 'Learning Roadmap', subtitle: 'Personalized Milestone Curriculum' },
    '/jobs': { title: 'Job & Internship Discovery', subtitle: 'Campus & Off-Campus Opportunities' },
    '/applications': { title: 'Application Tracker', subtitle: 'Kanban Placement Pipeline' },
    '/resume-builder': { title: 'ATS Resume Builder', subtitle: 'Dynamic Markdown & PDF Format' },
    '/resume-analysis': { title: 'Resume ATS Analysis', subtitle: 'Scoring & Keyword Optimization' },
    '/interview-prep': { title: 'Interview Preparation Hub', subtitle: 'Question Bank & Topics' },
    '/interview-session': { title: 'Mock Interview Simulator', subtitle: 'Timed Technical Practice' },
    '/ai-assistant': { title: 'AI Career Assistant', subtitle: 'Interactive Placement Agent' },
    '/notifications': { title: 'Notifications & Alerts', subtitle: 'System & Interview Reminders' },
    '/settings': { title: 'Account Settings', subtitle: 'Preferences & Security' },
  };

  const currentRouteInfo = routeTitles[location.pathname] || {
    title: 'Career Pilot AI',
    subtitle: 'Placement Platform',
  };

  const userMenuItems = [
    {
      id: 'profile',
      label: 'View Profile',
      icon: <User className="w-4 h-4" />,
      onClick: () => navigate('/profile'),
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-4 h-4" />,
      onClick: () => navigate('/settings'),
    },
    {
      id: 'logout',
      label: 'Sign Out',
      danger: true,
      icon: <LogOut className="w-4 h-4" />,
      onClick: () => {
        logout();
        navigate('/');
      },
    },
  ];

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger + Page Breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="md:hidden text-slate-600 hover:text-slate-900 p-1.5 rounded-lg hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Open sidebar menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight">
              {currentRouteInfo.title}
            </h1>
            <p className="text-[11px] text-slate-400 hidden sm:block leading-tight">
              {currentRouteInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Center: Search input shortcut */}
        <div className="hidden lg:flex items-center max-w-xs w-full">
          <div
            onClick={() => navigate('/jobs')}
            className="flex items-center gap-2 px-3 py-1.5 w-full rounded-xl bg-slate-100 hover:bg-slate-200/70 border border-slate-200/80 text-xs text-slate-400 cursor-pointer transition-colors"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate">Quick search jobs, skills, questions...</span>
            <kbd className="ml-auto font-mono text-[10px] bg-white border border-slate-200 rounded px-1 text-slate-400">
              /
            </kbd>
          </div>
        </div>

        {/* Right: Quick actions + Alerts + Profile */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Quick AI Assistant Trigger */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/ai-assistant')}
            leftIcon={<Sparkles className="w-3.5 h-3.5 text-indigo-600" />}
            className="hidden sm:inline-flex text-xs py-1.5 border-indigo-200 bg-indigo-50/50 text-indigo-700 hover:bg-indigo-100/60"
          >
            Ask AI Agent
          </Button>

          {/* Notifications Link */}
          <Link
            to="/notifications"
            className="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="View notifications"
          >
            <Bell className="w-5 h-5" />
            {displayUnread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-indigo-600 ring-2 ring-white text-[10px] text-white font-bold flex items-center justify-center">
                {displayUnread > 9 ? '9+' : displayUnread}
              </span>
            )}
          </Link>

          {/* Profile Dropdown */}
          <Dropdown
            align="right"
            trigger={
              <div className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 transition-colors">
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  className="w-8 h-8 rounded-full object-cover border border-slate-200"
                />
                <span className="hidden xl:block text-xs font-semibold text-slate-800 text-left pr-1">
                  {profile.name}
                </span>
              </div>
            }
            items={userMenuItems}
          />
        </div>
      </div>
    </header>
  );
};

