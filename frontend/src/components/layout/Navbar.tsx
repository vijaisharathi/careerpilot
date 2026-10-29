import React from 'react';
import { Compass, Sparkles, User, LogOut, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useHealthCheck } from '../../hooks/useHealthCheck';
import { Badge } from '../common/Badge';

export interface NavbarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onTabChange }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { data: health, isLoading: healthLoading } = useHealthCheck(15000);

  const navLinks = [
    { id: 'overview', label: 'Platform' },
    { id: 'status', label: 'API & Health' },
    { id: 'states', label: 'UI States' },
    { id: 'ai-demo', label: 'AI Advisor' },
    { id: 'dashboard', label: 'Student Dashboard' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onTabChange('overview')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <Compass className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-lg tracking-tight">Career Pilot AI</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <Sparkles className="w-2.5 h-2.5" /> Agent v0.1
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">AI-Powered Career Guidance & Placement</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => onTabChange(link.id)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  currentTab === link.id
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Right Section: System Health + Auth */}
          <div className="flex items-center gap-3">
            {/* Health pill */}
            <div className="hidden lg:flex items-center">
              {healthLoading ? (
                <Badge variant="neutral" size="sm" dot>
                  Checking API...
                </Badge>
              ) : health?.status === 'healthy' ? (
                <Badge variant="success" size="sm" dot title="Backend & MongoDB Connected">
                  <CheckCircle className="w-3 h-3 text-emerald-600 inline mr-1" />
                  API Online
                </Badge>
              ) : (
                <Badge variant="warning" size="sm" dot title="Backend responding, MongoDB offline in dev">
                  <AlertTriangle className="w-3 h-3 text-amber-600 inline mr-1" />
                  API Degraded
                </Badge>
              )}
            </div>

            {/* Auth section */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-semibold text-xs flex items-center justify-center">
                  {user.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-semibold text-slate-800 leading-tight">{user.name}</div>
                  <div className="text-[10px] text-slate-500 capitalize">{user.role}</div>
                </div>
                <button
                  onClick={logout}
                  title="Logout"
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onTabChange('login')}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors inline-flex items-center gap-1.5"
                >
                  <User className="w-3.5 h-3.5" />
                  Sign In
                </button>
                <button
                  onClick={() => onTabChange('register')}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-200 transition-all"
                >
                  Get Started
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
