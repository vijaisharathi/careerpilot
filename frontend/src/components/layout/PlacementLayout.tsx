import React from 'react';
import { Navigate, Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Target,
  TrendingUp,
  Megaphone,
  LogOut,
  Building2,
  GraduationCap,
  ArrowRightLeft,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../common/Spinner';
import { Badge } from '../common/Badge';

export const PlacementLayout: React.FC = () => {
  const { isAuthenticated, user, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-slate-100">
        <Spinner size="lg" className="text-emerald-400 mb-4" />
        <p className="text-sm font-medium tracking-wide text-slate-400">
          Verifying placement authority credentials...
        </p>
      </div>
    );
  }

  // Unauthenticated -> redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Not a placement officer or admin -> redirect to student dashboard
  if (user?.role !== 'placement_officer' && user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const navItems = [
    { name: 'Dashboard', path: '/placement/dashboard', icon: LayoutDashboard },
    { name: 'Student Directory', path: '/placement/students', icon: Users },
    { name: 'Placement Readiness', path: '/placement/readiness', icon: Target },
    { name: 'Recruitment Drives', path: '/placement/drives', icon: Briefcase },
    { name: 'Placement Analytics', path: '/placement/analytics', icon: TrendingUp },
    { name: 'Announcements', path: '/placement/announcements', icon: Megaphone },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Placement Officer Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 text-slate-700">
        {/* Brand */}
        <div className="p-5 border-b border-slate-200/80 flex items-center justify-between bg-white">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 tracking-tight">Career Pilot AI</h1>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
                Placement Portal
              </p>
            </div>
          </div>
          <Badge variant="success" size="sm">
            Officer
          </Badge>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.path ||
              (item.path === '/placement/dashboard' && location.pathname === '/placement');

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 shadow-xs border border-emerald-100/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <Icon
                  className={`w-4 h-4 mr-2.5 shrink-0 ${
                    isActive ? 'text-emerald-600' : 'text-slate-400'
                  }`}
                />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Switcher & User Profile */}
        <div className="p-3 border-t border-slate-200/80 bg-slate-50/80 space-y-2">
          {user?.role === 'admin' && (
            <button
              onClick={() => navigate('/admin/overview')}
              className="w-full flex items-center px-3 py-2 rounded-lg text-xs font-semibold text-indigo-700 hover:text-indigo-800 hover:bg-indigo-50 border border-indigo-200/60 transition-colors"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 mr-2" />
              <span>Switch to Admin Portal</span>
            </button>
          )}

          <button
            onClick={() => navigate('/dashboard')}
            className="w-full flex items-center px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 mr-2" />
            <span>Switch to Student View</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 rounded-lg text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5 mr-2" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Institution Scope Footer */}
        <div className="p-3 bg-slate-100/70 border-t border-slate-200 flex items-center space-x-2 text-[11px] text-slate-500">
          <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate">Campus Placement Division</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Placement Header */}
        <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Placement Cell
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-bold text-slate-800 capitalize">
              {location.pathname.replace('/placement/', '').replace('-', ' ') || 'Dashboard'}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-2.5 py-1 rounded-full text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Campus Drives Active</span>
            </div>

            <div className="h-4 w-px bg-slate-200" />

            <div className="flex items-center space-x-1.5 text-xs text-slate-600 font-medium">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span className="truncate max-w-[140px]">{user?.email}</span>
            </div>
          </div>
        </header>

        {/* Dynamic Placement View */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

