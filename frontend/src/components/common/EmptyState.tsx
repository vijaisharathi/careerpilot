import React from 'react';
import { Inbox } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../utils/cn';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 text-center',
        className
      )}
    >
      <div className="p-3 bg-white border border-slate-200 text-slate-400 rounded-2xl shadow-sm mb-3">
        {icon || <Inbox className="w-8 h-8 text-slate-400" />}
      </div>

      <h4 className="text-base font-semibold text-slate-800">{title}</h4>
      <p className="text-sm text-slate-500 mt-1 max-w-sm leading-relaxed">{description}</p>

      {actionText && onAction && (
        <div className="mt-5">
          <Button variant="primary" size="sm" onClick={onAction}>
            {actionText}
          </Button>
        </div>
      )}
    </div>
  );
};
