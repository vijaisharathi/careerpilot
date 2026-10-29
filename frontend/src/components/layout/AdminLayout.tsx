import React from 'react';
import { Navigate, Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Target,
  BookOpen,
  Sparkles,
  ShieldCheck,
  Settings,
  ArrowRightLeft,
  LogOut,
  ShieldAlert,
  Server,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../common/Spinner';
import { Badge } from '../common/Badge';

export const AdminLayout: React.FC = () => {
  const { isAuthenticated, user, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-slate-100">
        <Spinner size="lg" className="text-indigo-400 mb-4" />
        <p className="text-sm font-medium tracking-wide text-slate-400">
          Verifying administrative credentials...
        </p>
      </div>
    );
  }

  // Not authenticated -> redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Authenticated but not an administrator -> redirect to student dashboard
  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const navItems = [
    { name: 'Overview', path: '/admin/overview', icon: LayoutDashboard },
    { name: 'Student Management', path: '/admin/students', icon: Users },
    { name: 'Jobs & Internships', path: '/admin/jobs', icon: Briefcase },
    { name: 'Career Role Catalog', path: '/admin/career-roles', icon: Target },
    { name: 'Learning Resources', path: '/admin/learning-resources', icon: BookOpen },
    { name: 'AI Monitoring', path: '/admin/ai-monitoring', icon: Sparkles },
    { name: 'Audit Logs', path: '/admin/audit-logs', icon: ShieldCheck },
    { name: 'Platform Settings', path: '/admin/settings', icon: Settings },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Admin Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 text-slate-700">
        {/* Brand */}
        <div className="p-5 border-b border-slate-200/80 flex items-center justify-between bg-white">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 tracking-tight">Career Pilot AI</h1>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600">
                Admin Console
              </p>
            </div>
          </div>
          <Badge variant="warning" size="sm">
            Admin
          </Badge>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.path ||
              (item.path === '/admin/overview' && location.pathname === '/admin');

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 shadow-xs border border-indigo-100/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <Icon className={`w-4 h-4 mr-2.5 shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Switcher & User Profile */}
        <div className="p-3 border-t border-slate-200/80 bg-slate-50/80 space-y-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full flex items-center px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
          >
            <ArrowRightLeft className="w-4 h-4 mr-2.5 text-slate-400" />
            <span>Switch to Student View</span>
          </button>

          <div className="pt-2 border-t border-slate-200 flex items-center justify-between px-2">
            <div className="flex items-center space-x-2 truncate">
              <div className="w-7 h-7 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-xs font-bold text-indigo-700">
                {user?.name?.charAt(0) || 'A'}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-900 truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Admin Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Admin Header */}
        <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Administration Portal
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-bold text-slate-800 capitalize">
              {location.pathname.replace('/admin/', '').replace('-', ' ') || 'Overview'}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-2.5 py-1 rounded-full text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>System Live</span>
            </div>

            <div className="hidden sm:flex items-center space-x-1.5 text-xs text-slate-500">
              <Server className="w-3.5 h-3.5 text-slate-400" />
              <span>MongoDB Connected</span>
            </div>

            <div className="h-4 w-px bg-slate-200" />

            <div className="flex items-center space-x-1.5 text-xs text-slate-600 font-medium">
              <UserCheck className="w-4 h-4 text-indigo-600" />
              <span className="truncate max-w-[120px]">{user?.email}</span>
            </div>
          </div>
        </header>

        {/* Dynamic Admin View */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

