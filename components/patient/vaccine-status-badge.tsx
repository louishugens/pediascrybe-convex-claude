import { cn } from '@/lib/utils';
import type { VaccineStatusType, DoseStatusType } from '@/lib/vaccination-compliance';

const statusConfig: Record<DoseStatusType, { label: string; className: string }> = {
  completed: {
    label: 'Completed',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800',
  },
  due: {
    label: 'Due',
    className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800',
  },
  overdue: {
    label: 'Overdue',
    className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800',
  },
  upcoming: {
    label: 'Upcoming',
    className: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/50 dark:text-slate-400 dark:border-slate-700',
  },
  not_applicable: {
    label: 'N/A',
    className: 'bg-slate-50 text-slate-400 border-slate-200 dark:bg-slate-900/50 dark:text-slate-500 dark:border-slate-700',
  },
};

interface VaccineStatusBadgeProps {
  status: DoseStatusType | VaccineStatusType;
  size?: 'sm' | 'md';
  className?: string;
}

export default function VaccineStatusBadge({ status, size = 'sm', className }: VaccineStatusBadgeProps) {
  const config = statusConfig[status];
  if (!config) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
