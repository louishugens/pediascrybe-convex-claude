'use client';

import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { Pencil, Trash2, User, Heart, Phone } from 'lucide-react';
import DeletePatientButton from './deletePatientButton';
import { Id } from '@/convex/_generated/dataModel';

interface Patient {
  _id: string;
  firstname?: string;
  lastname?: string;
  birthdate?: number;
  sex?: string;
  allergies?: string;
  bloodtype?: string;
  phone?: string;
  email?: string;
  mothername?: string;
  religion?: string;
  electrophoresis?: string;
  history?: string;
}

interface DemographicsDialogProps {
  patient: Patient;
  patientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export default function DemographicsDialog({ 
  patient, 
  patientId, 
  open, 
  onOpenChange 
}: DemographicsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {patient.firstname} {patient.lastname}
          </DialogTitle>
          <DialogDescription>
            Complete patient information
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {open && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="space-y-6 py-4"
            >
              {/* Personal Information */}
              <motion.div variants={itemVariants}>
                <div className="flex items-center gap-2 mb-3">
                  <User className="h-4 w-4 text-primary" />
                  <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                    Personal Information
                  </h4>
                </div>
                <div className="grid grid-cols-2 gap-4 pl-6">
                  <InfoItem label="Birth Date" value={patient.birthdate ? format(new Date(patient.birthdate), 'MMMM d, yyyy') : undefined} />
                  <InfoItem label="Sex" value={patient.sex} />
                  <InfoItem label="Mother's Name" value={patient.mothername} />
                  <InfoItem label="Religion" value={patient.religion} />
                </div>
              </motion.div>

              <Separator />

              {/* Medical Information */}
              <motion.div variants={itemVariants}>
                <div className="flex items-center gap-2 mb-3">
                  <Heart className="h-4 w-4 text-primary" />
                  <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                    Medical Information
                  </h4>
                </div>
                <div className="grid grid-cols-2 gap-4 pl-6">
                  <InfoItem label="Blood Type" value={patient.bloodtype} />
                  <InfoItem label="Electrophoresis" value={patient.electrophoresis} />
                  <div className="col-span-2">
                    <InfoItem label="Allergies" value={patient.allergies} />
                  </div>
                  <div className="col-span-2">
                    <InfoItem label="Medical History" value={patient.history} />
                  </div>
                </div>
              </motion.div>

              <Separator />

              {/* Contact Information */}
              <motion.div variants={itemVariants}>
                <div className="flex items-center gap-2 mb-3">
                  <Phone className="h-4 w-4 text-primary" />
                  <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                    Contact Information
                  </h4>
                </div>
                <div className="grid grid-cols-2 gap-4 pl-6">
                  <InfoItem label="Phone" value={patient.phone} />
                  <InfoItem label="Email" value={patient.email} />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <DialogFooter className="flex-row gap-2 sm:gap-2">
          <Button variant="outline" asChild onClick={() => onOpenChange(false)}>
            <Link href={`/user/patients/${patientId}/edit-patient`}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit Patient
            </Link>
          </Button>
          <DeletePatientButton patientId={patientId as Id<"patients">} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InfoItem({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
      <p className="text-sm text-foreground">{value || '—'}</p>
    </div>
  );
}
