'use client'

import { Unlink, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface WhatsAppUnlinkButtonProps {
  onUnlink: () => void
  isLoading?: boolean
}

export function WhatsAppUnlinkButton({
  onUnlink,
  isLoading = false,
}: WhatsAppUnlinkButtonProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" disabled={isLoading} className="gap-2">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Unlink className="w-4 h-4" />
          )}
          Unlink WhatsApp
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-red-100 text-red-600">
            <Unlink className="w-6 h-6" />
          </AlertDialogMedia>
          <AlertDialogTitle>Unlink WhatsApp?</AlertDialogTitle>
          <AlertDialogDescription>
            This will disconnect WhatsApp from your account. You will no longer
            be able to use ScrybeGPT via WhatsApp until you link again.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onUnlink}>
            Yes, unlink
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
