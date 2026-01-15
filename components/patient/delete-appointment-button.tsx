'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Trash2, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { deleteAppointment } from '@/app/actions';
import { Id } from '@/convex/_generated/dataModel';

interface DeleteAppointmentButtonProps {
  appointmentId: Id<"appointments">;
  patientId: Id<"patients">;
}

export default function DeleteAppointmentButton({ 
  appointmentId, 
  patientId 
}: DeleteAppointmentButtonProps) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await deleteAppointment(appointmentId, patientId);
      if (res.success) {
        toast.success('Appointment deleted successfully');
        setOpen(false);
      } else {
        toast.error(res.error || 'Failed to delete appointment');
      }
    } catch {
      toast.error('An error occurred while deleting');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
            <Trash2 className="h-4 w-4" />
          </Button>
        </motion.div>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Consultation</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this consultation? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <DialogClose asChild>
            <Button variant="outline" disabled={loading}>
              Cancel
            </Button>
          </DialogClose>
          <Button 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
