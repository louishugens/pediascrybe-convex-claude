'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import { FileText, Shield, Receipt, ChevronRight, LucideIcon, UserPlus, FlaskConical, Pill } from 'lucide-react';
import { InviteDialog } from '@/components/portal/invite-dialog';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Badge } from '@/components/ui/badge';

interface QuickActionsProps {
  patientId: string;
  patientName?: string;
  patientEmail?: string;
}

interface QuickActionItemProps {
  href: string;
  label: string;
  Icon: LucideIcon;
  color: string;
  badge?: React.ReactNode;
}

function QuickActionItem({ href, label, Icon, color, badge }: QuickActionItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link href={href as any}>
        <motion.div
          whileHover={{ x: 4, backgroundColor: 'var(--muted)' }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer group"
        >
          <div className={color}>
            <Icon className="h-4 w-4" />
          </div>
          <span className="flex-1 text-sm font-medium text-foreground">
            {label}
          </span>
          {badge}
          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </motion.div>
      </Link>
    </motion.div>
  );
}

export default function QuickActions({ patientId, patientName, patientEmail }: QuickActionsProps) {
  const pid = patientId as Id<'patients'>;
  const activeScripts = useQuery(api.appointments.listActivePrescriptionsByPatient, { patientId: pid });
  const labs = useQuery(api.appointments.listLabOrdersByPatient, { patientId: pid });

  const pendingLabsCount = (labs ?? []).filter(
    (o) => o.status === "ordered" || o.status === "collected" || o.status === "resulted",
  ).length;
  const activeScriptsCount = activeScripts?.length ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-4 shadow-sm"
    >
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
        Quick Actions
      </h4>

      <div className="space-y-2">
        <QuickActionItem
          href={`/user/patients/${patientId}/reports`}
          label="Reports & Certificates"
          Icon={FileText}
          color="text-primary"
        />
        <QuickActionItem
          href={`/user/patients/${patientId}/vaccines`}
          label="Vaccines"
          Icon={Shield}
          color="text-primary"
        />
        <QuickActionItem
          href={`/user/patients/${patientId}/labs`}
          label="Labs"
          Icon={FlaskConical}
          color="text-primary"
          badge={
            pendingLabsCount > 0 ? (
              <Badge variant="secondary" className="text-[10px]">{pendingLabsCount} pending</Badge>
            ) : undefined
          }
        />
        <QuickActionItem
          href={`/user/patients/${patientId}/prescriptions`}
          label="Prescriptions"
          Icon={Pill}
          color="text-primary"
          badge={
            activeScriptsCount > 0 ? (
              <Badge variant="secondary" className="text-[10px]">{activeScriptsCount} active</Badge>
            ) : undefined
          }
        />
        <QuickActionItem
          href={`/user/patients/${patientId}/receipts`}
          label="Receipts"
          Icon={Receipt}
          color="text-amber-500"
        />
      </div>

      {/* Portal Invitation */}
      <div className="mt-3 pt-3 border-t border-border/50">
        <InviteDialog
          patientId={patientId as any}
          patientEmail={patientEmail}
          patientName={patientName || "this patient"}
        />
      </div>
    </motion.div>
  );
}
