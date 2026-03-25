'use client'

import { Smartphone, Clock, WifiOff } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface WhatsAppLinkStatusProps {
  status: 'unlinked' | 'pending' | 'active'
  phoneNumber?: string
  linkedAt?: number
}

function formatLinkedDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function WhatsAppLinkStatus({
  status,
  phoneNumber,
  linkedAt,
}: WhatsAppLinkStatusProps) {
  if (status === 'active') {
    return (
      <div className="flex flex-col gap-1">
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 w-fit gap-1.5 px-3 py-1.5 text-sm font-medium">
          <Smartphone className="w-3.5 h-3.5" />
          {phoneNumber ?? 'Linked'}
        </Badge>
        {linkedAt && (
          <p className="text-xs text-muted-foreground pl-1">
            Linked on {formatLinkedDate(linkedAt)}
          </p>
        )}
      </div>
    )
  }

  if (status === 'pending') {
    return (
      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 w-fit gap-1.5 px-3 py-1.5 text-sm font-medium">
        <Clock className="w-3.5 h-3.5" />
        Waiting for scan...
      </Badge>
    )
  }

  return (
    <Badge
      variant="secondary"
      className="w-fit gap-1.5 px-3 py-1.5 text-sm font-medium text-muted-foreground"
    >
      <WifiOff className="w-3.5 h-3.5" />
      Not linked
    </Badge>
  )
}
