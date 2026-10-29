import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home, LayoutDashboard } from 'lucide-react';
import { Button } from '../components/common/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-20 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mx-auto mb-4">
        <Compass className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">404</h1>
      <h2 className="text-xl font-bold text-slate-800 mt-2">Page Not Found</h2>
      <p className="mt-2 text-sm text-slate-500 max-w-sm">
        The destination you are navigating to does not exist or has been moved.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <Link to="/">
          <Button variant="outline" size="sm" leftIcon={<Home className="w-4 h-4" />}>
            Public Home
          </Button>
        </Link>
        <Link to="/dashboard">
          <Button variant="primary" size="sm" leftIcon={<LayoutDashboard className="w-4 h-4" />}>
            Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
};
