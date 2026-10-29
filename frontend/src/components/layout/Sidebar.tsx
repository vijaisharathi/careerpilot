import React from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Compass,
  LayoutDashboard,
  User,
  TrendingUp,
  Target,
  Map,
  Briefcase,
  FileText,
  FileCheck,
  Video,
  PlayCircle,
  Kanban,
  Bot,
  Bell,
  Settings,
  X,
  ExternalLink,
  Sparkles,
  ShieldAlert,
  GraduationCap,
  Building2,
  Terminal,
} from 'lucide-react';
import { useStudentData } from '../../context/StudentDataContext';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  highlight?: boolean;
}

interface NavSection {
  group: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { profile, notifications } = useStudentData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const unreadNotifsCount = notifications.filter((n) => !n.read).length;

  const navSections: NavSection[] = [
    {
      group: 'OVERVIEW',
      items: [
        { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
        { path: '/profile', label: 'Profile & Skills', icon: <User className="w-4 h-4" /> },
      ],
    },
    {
      group: 'CAREER STRATEGY',
      items: [
        { path: '/career-analysis', label: 'Career Fit Analysis', icon: <TrendingUp className="w-4 h-4" /> },
        { path: '/skill-gap', label: 'Skill Gap Matrix', icon: <Target className="w-4 h-4" /> },
        { path: '/roadmap', label: 'Learning Roadmap', icon: <Map className="w-4 h-4" /> },
      ],
    },
    {
      group: 'PLACEMENTS & JOBS',
      items: [
        { path: '/campus-drives', label: 'Campus Drives', icon: <Building2 className="w-4 h-4 text-emerald-600" /> },
        { path: '/jobs', label: 'Jobs & Internships', icon: <Briefcase className="w-4 h-4" /> },
        { path: '/applications', label: 'Application Tracker', icon: <Kanban className="w-4 h-4" /> },
        { path: '/resume-builder', label: 'Resume Builder', icon: <FileText className="w-4 h-4" /> },
        { path: '/resume-analysis', label: 'Resume Analysis', icon: <FileCheck className="w-4 h-4" /> },
      ],
    },
    {
      group: 'PREPARATION & AGENT',
      items: [
        { path: '/coding', label: 'Coding Assessments', icon: <Terminal className="w-4 h-4 text-emerald-600" /> },
        { path: '/interview-prep', label: 'Interview Prep Hub', icon: <Video className="w-4 h-4" /> },
        { path: '/interview-session', label: 'Mock Session Simulator', icon: <PlayCircle className="w-4 h-4" /> },
        {
          path: '/ai-assistant',
          label: 'AI Career Assistant',
          icon: <Bot className="w-4 h-4 text-indigo-600" />,
          highlight: true,
        },
      ],
    },
    {
      group: 'SYSTEM',
      items: [
        {
          path: '/notifications',
          label: 'Notifications',
          icon: <Bell className="w-4 h-4" />,
          badge: unreadNotifsCount > 0 ? unreadNotifsCount : undefined,
        },
        { path: '/settings', label: 'Account Settings', icon: <Settings className="w-4 h-4" /> },
      ],
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white text-slate-700">
      {/* Brand Header */}
      <div className="px-5 py-4 border-b border-slate-200/80 flex items-center justify-between bg-white">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-700 flex items-center justify-center text-white shadow-sm shadow-indigo-200">
            <Compass className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 text-base tracking-tight group-hover:text-indigo-600 transition-colors">
                Career Pilot AI
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Placement Agent v0.1</p>
          </div>
        </Link>
        {isOpen && (
          <button
            onClick={onClose}
            className="md:hidden text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navSections.map((sec, idx) => (
          <div key={idx}>
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {sec.group}
            </div>
            <div className="space-y-1">
              {sec.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-all group',
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 shadow-xs border border-indigo-100/60'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80',
                      item.highlight && !location.pathname.includes(item.path) && 'text-indigo-600 hover:text-indigo-700'
                    )
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <span className="shrink-0 transition-colors">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
                      {item.badge}
                    </span>
                  )}
                  {item.highlight && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Profile Summary */}
      <div className="p-3 border-t border-slate-200/80 bg-slate-50/80">
        <div
          onClick={() => {
            navigate('/profile');
            onClose();
          }}
          className="flex items-center gap-3 p-2 rounded-xl hover:bg-white hover:shadow-xs border border-transparent hover:border-slate-200 transition-all cursor-pointer"
        >
          <img
            src={profile.avatar}
            alt={profile.name}
            className="w-8 h-8 rounded-full object-cover border border-slate-200"
          />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-slate-900 truncate">{profile.name}</div>
            <div className="text-[11px] text-slate-500 truncate">{profile.education.currentYear}</div>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-slate-200/80 px-1 flex items-center justify-between text-[11px] text-slate-500">
          <Link to="/" className="inline-flex items-center gap-1 hover:text-indigo-600 transition-colors">
            <ExternalLink className="w-3 h-3" /> Public Site
          </Link>
          <span className="text-[10px] bg-slate-200/70 text-slate-700 font-mono px-1.5 py-0.5 rounded border border-slate-300/60 font-medium">
            PROTOTYPE
          </span>
        </div>
        {(user?.role === 'placement_officer' || user?.role === 'admin') && (
          <div className="mt-2 pt-2 border-t border-slate-200/80">
            <Link
              to="/placement/dashboard"
              onClick={onClose}
              className="flex items-center justify-center gap-1.5 w-full py-1.5 px-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold transition-colors"
            >
              <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
              <span>Placement Portal</span>
            </Link>
          </div>
        )}
        {user?.role === 'admin' && (
          <div className="mt-2 pt-2 border-t border-slate-200/80">
            <Link
              to="/admin/overview"
              onClick={onClose}
              className="flex items-center justify-center gap-1.5 w-full py-1.5 px-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold transition-colors"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-indigo-600" />
              <span>Admin Console</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-slate-200 bg-white h-screen sticky top-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200 bg-white">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
