import React from 'react';
import { Spinner } from './Spinner';
import { cn } from '../../utils/cn';

export interface LoadingStateProps {
  title?: string;
  message?: string;
  className?: string;
  showSkeleton?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  title = 'Loading data...',
  message = 'Please wait while we communicate with the Career Pilot AI services.',
  className,
  showSkeleton = true,
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex flex-col items-center justify-center p-8 rounded-xl border border-slate-200 bg-white/60 text-center animate-fade-in',
        className
      )}
    >
      <div className="p-3 bg-indigo-50 rounded-full mb-3 shadow-inner">
        <Spinner size="lg" className="text-indigo-600" />
      </div>

      <h4 className="text-base font-semibold text-slate-800">{title}</h4>
      <p className="text-sm text-slate-500 mt-1 max-w-sm">{message}</p>

      {showSkeleton && (
        <div className="w-full max-w-xs mt-6 space-y-2.5 animate-pulse">
          <div className="h-3 bg-slate-200 rounded-full w-full"></div>
          <div className="h-3 bg-slate-200 rounded-full w-4/5 mx-auto"></div>
          <div className="h-3 bg-slate-100 rounded-full w-2/3 mx-auto"></div>
        </div>
      )}
    </div>
  );
};
