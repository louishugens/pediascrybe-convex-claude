'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, CheckCircle2, Shield, Plus, Settings } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  calculatePatientAgeInMonths,
  calculateOverallCompliance,
  type Vaccine,
  type VaccinationRecord,
  type VaccineStatusType,
} from '@/lib/vaccination-compliance';
import VaccineCard from './vaccine-card';
import { SubscriptionLink } from '@/components/subscription-link';

type FilterTab = 'all' | VaccineStatusType;

interface VaccineTrackingDashboardProps {
  patientId: string;
  birthdate: number;
  vaccines: Vaccine[];
  records: VaccinationRecord[];
}

const filterTabs: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'due', label: 'Due' },
  { key: 'completed', label: 'Completed' },
  { key: 'upcoming', label: 'Upcoming' },
];

export default function VaccineTrackingDashboard({
  patientId,
  birthdate,
  vaccines,
  records,
}: VaccineTrackingDashboardProps) {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  const ageInMonths = calculatePatientAgeInMonths(birthdate);
  const compliance = calculateOverallCompliance(vaccines, ageInMonths, records);

  const filteredVaccines =
    activeFilter === 'all'
      ? compliance.vaccines
      : compliance.vaccines.filter((v) => v.overallStatus === activeFilter);

  // Dose-level counts used for filter tab badges and header chips
  const doseCounts: Record<FilterTab, number> = {
    all: compliance.expectedDoses,
    overdue: compliance.overdueDoses,
    due: compliance.dueDoses,
    completed: compliance.completedDoses,
    upcoming: compliance.upcomingDoses,
  };

  if (vaccines.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-8 shadow-sm text-center"
      >
        <Shield className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
        <h3 className="text-sm font-semibold text-foreground mb-1">No Vaccines Tracked</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Add vaccines to your profile to start tracking patient vaccination compliance.
        </p>
        <Link href="/user/profile" as={"/user/profile" as any}>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Settings className="h-3.5 w-3.5" />
            Manage Tracked Vaccines
          </motion.div>
        </Link>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with overall stats */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-5 shadow-sm"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Vaccination Tracking</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {compliance.completedDoses} of {compliance.expectedDoses} expected doses completed
              {compliance.upcomingDoses > 0 && (
                <span className="text-muted-foreground/60"> ({compliance.upcomingDoses} more upcoming)</span>
              )}
            </p>
          </div>
          <SubscriptionLink feature="vaccination_management" featureDisplayName="Vaccination Management" href={`/user/patients/${patientId}/vaccines/add-record`} className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            <Plus className="h-3.5 w-3.5" />
            Add Record
          </SubscriptionLink>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2.5 bg-muted/40 rounded-full overflow-hidden">
              <motion.div
                className={cn(
                  'h-full rounded-full',
                  compliance.completionPercentage === 100
                    ? 'bg-emerald-500'
                    : compliance.overdueDoses > 0
                      ? 'bg-linear-to-r from-emerald-500 to-red-500'
                      : compliance.dueDoses > 0
                        ? 'bg-linear-to-r from-emerald-500 to-amber-500'
                        : 'bg-emerald-500',
                )}
                initial={{ width: 0 }}
                animate={{ width: `${compliance.completionPercentage}%` }}
                transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
              />
            </div>
            <span className="text-sm font-bold text-foreground min-w-[40px] text-right">
              {Math.round(compliance.completionPercentage)}%
            </span>
          </div>

          {/* Status summary chips (dose-level counts) */}
          <div className="flex flex-wrap gap-2">
            {doseCounts.completed > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3 w-3" />
                {doseCounts.completed} dose{doseCounts.completed !== 1 ? 's' : ''} completed
              </span>
            )}
            {doseCounts.overdue > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] text-red-600 dark:text-red-400 font-medium">
                <AlertTriangle className="h-3 w-3" />
                {doseCounts.overdue} dose{doseCounts.overdue !== 1 ? 's' : ''} overdue
              </span>
            )}
            {doseCounts.due > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
                <Shield className="h-3 w-3" />
                {doseCounts.due} dose{doseCounts.due !== 1 ? 's' : ''} due soon
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Overdue alert banner */}
      {compliance.overdueDoses > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/80 dark:bg-red-950/30 backdrop-blur-sm p-4 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-red-800 dark:text-red-300">
                Attention Required
              </h3>
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                {doseCounts.overdue} dose{doseCounts.overdue > 1 ? 's' : ''} overdue:
                {' '}{compliance.vaccines
                  .filter((v) => v.overallStatus === 'overdue')
                  .map((v) => v.vaccine.name)
                  .join(', ')}
                {' '}&mdash; please schedule accordingly.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Filter tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 mb-1">
        {filterTabs.map((tab) => {
          const count = doseCounts[tab.key];
          if (count === 0 && tab.key !== 'all') return null;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={cn(
                'relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap',
                activeFilter === tab.key
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
              )}
            >
              {tab.label}
              {count > 0 && (
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none',
                    activeFilter === tab.key
                      ? 'bg-background/20 text-background'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Vaccine cards grid */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={activeFilter}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          {filteredVaccines.length > 0 ? (
            filteredVaccines.map((vc, i) => (
              <VaccineCard
                key={vc.vaccine._id}
                compliance={vc}
                patientId={patientId}
                index={i}
              />
            ))
          ) : (
            <div className="col-span-full py-8 text-center">
              <p className="text-sm text-muted-foreground">
                No vaccines with status &ldquo;{activeFilter}&rdquo;
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
