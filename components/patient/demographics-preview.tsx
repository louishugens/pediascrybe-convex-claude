'use client';

import { motion } from 'motion/react';
import { formatDistanceToNow, format } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import DemographicsDialog from './demographics-dialog';
import { InvitationStatusBadge } from '@/components/portal/invitation-status-badge';
import { useState } from 'react';

interface Patient {
  _id: string;
  firstname?: string;
  lastname?: string;
  birthdate?: number;
  birthWeight?: number;
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

interface DemographicsPreviewProps {
  patient: Patient;
  patientId: string;
}

export default function DemographicsPreview({ patient, patientId }: DemographicsPreviewProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const initials = `${patient.firstname?.[0] || ''}${patient.lastname?.[0] || ''}`.toUpperCase();
  const age = patient.birthdate 
    ? formatDistanceToNow(new Date(patient.birthdate), { addSuffix: false })
    : 'Unknown';

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-4 shadow-sm"
      >
        {/* Header with Avatar */}
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-12 w-12 ring-2 ring-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">
              {patient.firstname} {patient.lastname}
            </h3>
            <p className="text-sm text-muted-foreground">
              {age} old · {patient.sex || 'Unknown'}
            </p>
          </div>
        </div>

        {/* Key Info Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          {patient.bloodtype && (
            <Badge variant="secondary" className="text-xs">
              🩸 {patient.bloodtype}
            </Badge>
          )}
          {patient.allergies && (
            <Badge variant="destructive" className="text-xs">
              ⚠️ Allergies
            </Badge>
          )}
          <InvitationStatusBadge patientId={patientId as any} />
        </div>

        {/* Quick Info */}
        <div className="space-y-2 text-sm">
          {patient.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="font-medium text-foreground">Phone:</span>
              <span className="truncate">{patient.phone}</span>
            </div>
          )}
          {patient.email && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="font-medium text-foreground">Email:</span>
              <span className="truncate">{patient.email}</span>
            </div>
          )}
        </div>

        {/* View Details Button */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="mt-4"
        >
          <Button 
            variant="outline" 
            className="w-full gap-2"
            onClick={() => setDialogOpen(true)}
          >
            View Full Details
            <ExternalLink className="h-4 w-4" />
          </Button>
        </motion.div>
      </motion.div>

      <DemographicsDialog 
        patient={patient} 
        patientId={patientId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
