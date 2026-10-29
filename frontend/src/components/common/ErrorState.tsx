import React, { useState } from 'react';
import { AlertCircle, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../utils/cn';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  errorDetails?: unknown;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while communicating with the server.',
  errorDetails,
  onRetry,
  className,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div
      role="alert"
      className={cn(
        'p-6 rounded-xl border border-rose-200 bg-rose-50/50 text-slate-800 transition-all',
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div className="p-2.5 bg-rose-100 text-rose-600 rounded-lg shrink-0">
          <AlertCircle className="w-5 h-5" />
        </div>

        <div className="flex-1">
          <h4 className="text-base font-semibold text-rose-900">{title}</h4>
          <p className="text-sm text-slate-600 mt-1 leading-relaxed">{message}</p>

          {Boolean(errorDetails) && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="inline-flex items-center gap-1 text-xs font-medium text-rose-700 hover:text-rose-800 focus:outline-none"
              >
                {showDetails ? 'Hide technical details' : 'Show technical details'}
                {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showDetails && (
                <pre className="mt-2 p-3 bg-slate-900 text-slate-100 text-xs rounded-lg overflow-x-auto font-mono max-h-40">
                  {typeof errorDetails === 'object'
                    ? JSON.stringify(errorDetails, null, 2)
                    : String(errorDetails)}
                </pre>
              )}
            </div>
          )}

          {onRetry && (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                className="bg-white border-rose-300 text-rose-800 hover:bg-rose-50"
              >
                Retry Request
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
