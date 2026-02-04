'use client';

import { motion } from 'motion/react';
import { SubscriptionLink } from '@/components/subscription-link';
import { Shield, AlertTriangle, ChevronRight, CheckCircle2 } from 'lucide-react';
import {
  calculatePatientAgeInMonths,
  calculateOverallCompliance,
  type Vaccine,
  type VaccinationRecord,
} from '@/lib/vaccination-compliance';

interface VaccinationStatusCardProps {
  patientId: string;
  birthdate: number;
  vaccines: Vaccine[];
  records: VaccinationRecord[];
}

function CircularProgress({ percentage, size = 56 }: { percentage: number; size?: number }) {
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const color =
    percentage === 100
      ? 'stroke-emerald-500'
      : percentage >= 70
        ? 'stroke-amber-500'
        : 'stroke-red-500';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          className="stroke-muted/30"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          className={color}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          strokeDasharray={circumference}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-foreground">
          {Math.round(percentage)}%
        </span>
      </div>
    </div>
  );
}

export default function VaccinationStatusCard({
  patientId,
  birthdate,
  vaccines,
  records,
}: VaccinationStatusCardProps) {
  const ageInMonths = calculatePatientAgeInMonths(birthdate);
  const compliance = calculateOverallCompliance(vaccines, ageInMonths, records);

  if (vaccines.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <SubscriptionLink feature="vaccination_management" featureDisplayName="Vaccination Management" href={`/user/patients/${patientId}/vaccines`} className="block w-full text-left">
        <motion.div
          whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-4 shadow-sm cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Vaccination Status
            </h4>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          <div className="flex items-center justify-between gap-8 w-full">
            <CircularProgress percentage={compliance.completionPercentage} />

            <div className="flex-1 min-w-0 space-y-1.5">
              <p className="text-sm font-medium text-foreground">
                {compliance.completedDoses} of {compliance.expectedDoses} doses
              </p>

              <div className="flex flex-wrap gap-1.5">
                {compliance.completionPercentage === 100 && compliance.expectedDoses > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    On Track
                  </span>
                )}
                {compliance.overdueDoses > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700 dark:bg-red-950/50 dark:text-red-400">
                    <AlertTriangle className="h-3 w-3" />
                    {compliance.overdueDoses} overdue
                  </span>
                )}
                {compliance.dueDoses > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
                    <Shield className="h-3 w-3" />
                    {compliance.dueDoses} due
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </SubscriptionLink>
    </motion.div>
  );
}
