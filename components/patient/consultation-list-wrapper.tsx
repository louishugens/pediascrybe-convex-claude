'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Eye, Pencil, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Id } from '@/convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import DeleteAppointmentButton from './delete-appointment-button';

interface ConsultationListWrapperProps {
  patientId: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

export default function ConsultationListWrapper({ patientId }: ConsultationListWrapperProps) {
  const appointments = useQuery(api.appointments.getPatientAppointments, { 
    patientId: patientId as Id<"patients"> 
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <h3 className="font-semibold text-foreground">Consultations</h3>
        <Button asChild size="sm">
          <Link href={`/user/patients/${patientId}/add-appointment`}>
            <Plus className="h-4 w-4 mr-2" />
            Add Consultation
          </Link>
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/30">
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Date</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Height</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Weight</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Head Circ.</th>
              <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <motion.tbody
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {appointments === undefined ? (
              // Loading state
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="border-b border-border/30">
                  <td colSpan={5} className="px-4 py-3">
                    <div className="h-5 bg-muted/50 rounded animate-pulse" />
                  </td>
                </tr>
              ))
            ) : appointments.length === 0 ? (
              // Empty state
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                      <span className="text-xl">📋</span>
                    </div>
                    <p className="text-sm text-muted-foreground">No consultations yet</p>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/user/patients/${patientId}/add-appointment`}>
                        Add First Consultation
                      </Link>
                    </Button>
                  </div>
                </td>
              </tr>
            ) : (
              appointments.map((appointment) => (
                <motion.tr
                  key={appointment._id}
                  variants={itemVariants}
                  whileHover={{ backgroundColor: 'var(--muted)' }}
                  className="border-b border-border/30 transition-colors"
                >
                  <td className="px-4 py-3 text-sm font-medium">
                    {format(appointment.startDate, 'MMM d, yyyy')}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {appointment.height ? `${appointment.height} cm` : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {appointment.weight ? `${appointment.weight} kg` : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {appointment.head ? `${appointment.head} cm` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                        <Button asChild variant="ghost" size="icon-sm">
                          <Link href={`/user/patients/${patientId}/${appointment._id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                        <Button asChild variant="ghost" size="icon-sm">
                          <Link href={`/user/patients/${patientId}/${appointment._id}/edit-appointment`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                      </motion.div>
                      <DeleteAppointmentButton 
                        appointmentId={appointment._id} 
                        patientId={patientId as Id<"patients">} 
                      />
                    </div>
                  </td>
                </motion.tr>
              ))
            )}
          </motion.tbody>
        </table>
      </div>
    </motion.div>
  );
}
