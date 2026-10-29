import React from 'react';
import { Filter, X } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterGroup {
  id: string;
  label: string;
  options: FilterOption[];
  selectedValue: string;
}

export interface FilterControlsProps {
  groups: FilterGroup[];
  onFilterChange: (groupId: string, value: string) => void;
  onResetFilters?: () => void;
  activeCount?: number;
  className?: string;
}

export const FilterControls: React.FC<FilterControlsProps> = ({
  groups,
  onFilterChange,
  onResetFilters,
  activeCount = 0,
  className,
}) => {
  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider shrink-0">
        <Filter className="w-3.5 h-3.5 text-slate-400" />
        <span>Filters</span>
        {activeCount > 0 && (
          <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">
            {activeCount}
          </span>
        )}
      </div>

      {groups.map((group) => (
        <div key={group.id} className="relative inline-block">
          <select
            value={group.selectedValue}
            onChange={(e) => onFilterChange(group.id, e.target.value)}
            className="text-xs font-medium bg-white border border-slate-300 rounded-lg py-1.5 pl-3 pr-7 text-slate-700 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer shadow-2xs"
          >
            {group.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {group.label}: {opt.label}
              </option>
            ))}
          </select>
        </div>
      ))}

      {activeCount > 0 && onResetFilters && (
        <button
          type="button"
          onClick={onResetFilters}
          className="text-xs font-medium text-rose-600 hover:text-rose-700 inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-rose-50 transition-colors"
        >
          <X className="w-3 h-3" /> Clear all
        </button>
      )}
    </div>
  );
};

