'use client';

import { motion } from 'motion/react';
import { CheckCircle2, Circle, AlertTriangle, Clock, ChevronDown, Plus } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import VaccineStatusBadge from './vaccine-status-badge';
import type { VaccineCompliance, DoseStatus } from '@/lib/vaccination-compliance';
import { SubscriptionLink } from '@/components/subscription-link';

interface VaccineCardProps {
  compliance: VaccineCompliance;
  patientId: string;
  index: number;
}

const borderColors: Record<string, string> = {
  completed: 'border-l-emerald-500',
  due: 'border-l-amber-500',
  overdue: 'border-l-red-500',
  upcoming: 'border-l-slate-300 dark:border-l-slate-600',
};

function DoseStatusIcon({ status }: { status: DoseStatus }) {
  switch (status.status) {
    case 'completed':
      return <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />;
    case 'due':
      return <Clock className="h-4 w-4 text-amber-500 shrink-0" />;
    case 'overdue':
      return <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />;
    case 'upcoming':
      return <Circle className="h-4 w-4 text-slate-300 dark:text-slate-600 shrink-0" />;
    default:
      return <Circle className="h-4 w-4 text-slate-200 dark:text-slate-700 shrink-0" />;
  }
}

function formatDoseLabel(dose: DoseStatus['dose']): string {
  const parts: string[] = [];
  if (dose.doseCount) {
    const ordinal = dose.doseCount === 1 ? '1st' : dose.doseCount === 2 ? '2nd' : dose.doseCount === 3 ? '3rd' : `${dose.doseCount}th`;
    parts.push(`${ordinal} dose`);
  }
  if (dose.doseType !== 'regular') {
    parts.push(`(${dose.doseType})`);
  }
  if (parts.length === 0) parts.push('Dose');
  return parts.join(' ');
}

function formatAgeLabel(maxAge?: number): string {
  if (maxAge === undefined || maxAge === null) return '';
  if (maxAge === 0) return 'At birth';
  if (maxAge < 12) return `${maxAge} mo`;
  const years = Math.floor(maxAge / 12);
  const months = maxAge % 12;
  if (months === 0) return `${years} yr${years > 1 ? 's' : ''}`;
  return `${years} yr${years > 1 ? 's' : ''} ${months} mo`;
}

function formatDelta(ds: DoseStatus): string {
  if (!ds.monthsDelta) return '';
  const absMonths = Math.abs(ds.monthsDelta);
  if (ds.status === 'overdue') {
    if (absMonths < 1) return `${Math.round(absMonths * 30)} days overdue`;
    return `${Math.round(absMonths)} mo overdue`;
  }
  if (ds.status === 'due') {
    if (absMonths < 1) return `Due in ${Math.round(absMonths * 30)} days`;
    return `Due in ${Math.round(absMonths)} mo`;
  }
  if (ds.status === 'upcoming') {
    if (absMonths < 1) return `In ${Math.round(absMonths * 30)} days`;
    return `In ${Math.round(absMonths)} mo`;
  }
  return '';
}

export default function VaccineCard({ compliance, patientId, index }: VaccineCardProps) {
  const [expanded, setExpanded] = useState(
    compliance.overallStatus === 'overdue' || compliance.overallStatus === 'due'
  );

  const { vaccine, doseStatuses, overallStatus, completedCount, expectedCount } = compliance;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        'rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm shadow-sm overflow-hidden border-l-4',
        borderColors[overallStatus],
      )}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-foreground truncate">
              {vaccine.name}
            </h3>
            <VaccineStatusBadge status={overallStatus} />
          </div>
          <div className="flex items-center gap-2">
            {/* Mini progress bar */}
            <div className="flex-1 h-1.5 bg-muted/50 rounded-full overflow-hidden max-w-[120px]">
              <motion.div
                className={cn(
                  'h-full rounded-full',
                  overallStatus === 'completed' ? 'bg-emerald-500' :
                  overallStatus === 'overdue' ? 'bg-red-500' :
                  overallStatus === 'due' ? 'bg-amber-500' :
                  'bg-slate-300 dark:bg-slate-600',
                )}
                initial={{ width: 0 }}
                animate={{ width: `${expectedCount > 0 ? (completedCount / expectedCount) * 100 : 0}%` }}
                transition={{ duration: 0.6, delay: 0.2 + index * 0.05 }}
              />
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {completedCount}/{expectedCount}
            </span>
          </div>
        </div>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </motion.div>
      </button>

      {/* Expanded dose timeline */}
      <motion.div
        initial={false}
        animate={{
          height: expanded ? 'auto' : 0,
          opacity: expanded ? 1 : 0,
        }}
        transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="overflow-hidden"
      >
        <div className="px-4 pb-4 space-y-0">
          {doseStatuses
            .filter((ds) => ds.status !== 'not_applicable')
            .map((ds, i) => (
              <div key={ds.dose._id} className="flex items-start gap-3 relative">
                {/* Vertical connector line */}
                {i < doseStatuses.filter((d) => d.status !== 'not_applicable').length - 1 && (
                  <div className="absolute left-[7px] top-5 w-px h-[calc(100%-4px)] bg-border/60" />
                )}
                <div className="pt-1">
                  <DoseStatusIcon status={ds} />
                </div>
                <div className="flex-1 min-w-0 py-1">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'text-sm',
                      ds.status === 'completed' ? 'text-foreground line-through opacity-70' : 'text-foreground font-medium',
                    )}>
                      {formatDoseLabel(ds.dose)}
                    </span>
                    {ds.dose.maxAge !== undefined && (
                      <span className="text-xs text-muted-foreground">
                        {formatAgeLabel(ds.dose.maxAge)}
                      </span>
                    )}
                  </div>
                  {ds.status === 'completed' && ds.recordDate && (
                    <p className="text-xs text-muted-foreground">
                      Given {new Date(ds.recordDate).toLocaleDateString()}
                    </p>
                  )}
                  {(ds.status === 'due' || ds.status === 'overdue' || ds.status === 'upcoming') && (
                    <p className={cn(
                      'text-xs',
                      ds.status === 'overdue' ? 'text-red-600 dark:text-red-400 font-medium' :
                      ds.status === 'due' ? 'text-amber-600 dark:text-amber-400' :
                      'text-muted-foreground',
                    )}>
                      {formatDelta(ds)}
                    </p>
                  )}
                </div>
              </div>
            ))}

          {/* Add record CTA */}
          {(overallStatus === 'due' || overallStatus === 'overdue') && (
            <div className="pt-2">
              <SubscriptionLink feature="vaccination_management" featureDisplayName="Vaccination Management" href={`/user/patients/${patientId}/vaccines/add-record`} className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-border/80 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors">
                <Plus className="h-3.5 w-3.5" />
                Add Record
              </SubscriptionLink>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
