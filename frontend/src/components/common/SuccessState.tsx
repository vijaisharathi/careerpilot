import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../utils/cn';

export interface SuccessStateProps {
  title: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export const SuccessState: React.FC<SuccessStateProps> = ({
  title,
  message,
  actionText,
  onAction,
  className,
  children,
}) => {
  return (
    <div
      role="status"
      className={cn(
        'p-6 rounded-xl border border-emerald-200 bg-emerald-50/60 text-slate-800 transition-all',
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-lg shrink-0">
          <CheckCircle2 className="w-5 h-5" />
        </div>

        <div className="flex-1">
          <h4 className="text-base font-semibold text-emerald-950">{title}</h4>
          <p className="text-sm text-slate-600 mt-1 leading-relaxed">{message}</p>

          {children && <div className="mt-3">{children}</div>}

          {actionText && onAction && (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={onAction}
                className="bg-white border-emerald-300 text-emerald-800 hover:bg-emerald-50"
              >
                {actionText}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
