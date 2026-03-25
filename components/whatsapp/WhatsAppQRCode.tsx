'use client'

import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Clock, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface WhatsAppQRCodeProps {
  token: string
  expiresAt: number
  kapsoPhoneNumber?: string
  onExpired?: () => void
  onRefresh?: () => void
}

function formatCountdown(seconds: number): string {
  if (seconds <= 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function WhatsAppQRCode({
  token,
  expiresAt,
  kapsoPhoneNumber,
  onExpired,
  onRefresh,
}: WhatsAppQRCodeProps) {
  const [secondsLeft, setSecondsLeft] = useState(() =>
    Math.max(0, Math.floor((expiresAt - Date.now()) / 1000))
  )
  const [expired, setExpired] = useState(secondsLeft <= 0)

  useEffect(() => {
    setSecondsLeft(Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)))
    setExpired(false)
  }, [token, expiresAt])

  useEffect(() => {
    if (expired) return

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000))
      setSecondsLeft(remaining)
      if (remaining <= 0) {
        setExpired(true)
        onExpired?.()
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [expiresAt, expired, onExpired])

  const phoneNumber = kapsoPhoneNumber || process.env.NEXT_PUBLIC_SCRYBEGPT_PHONE_NUMBER || ''
  const waUrl = `https://wa.me/${phoneNumber}?text=LINK_${token}`

  const isAlmostExpired = secondsLeft <= 60 && !expired

  if (expired) {
    return (
      <div className="flex flex-col items-center gap-4 py-6">
        <div className="w-64 h-64 rounded-2xl bg-muted/50 border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center gap-3">
          <Clock className="w-10 h-10 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground text-center px-4">
            QR code expired
          </p>
        </div>
        {onRefresh && (
          <Button variant="outline" onClick={onRefresh} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Generate new code
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div
        className={cn(
          'p-4 rounded-2xl border-2 bg-white transition-colors duration-300',
          isAlmostExpired
            ? 'border-amber-400 shadow-amber-100 shadow-md'
            : 'border-transparent shadow-sm'
        )}
      >
        <QRCodeSVG value={waUrl} size={256} level="M" />
      </div>

      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-sm text-muted-foreground">
          Scan with your phone camera
        </p>
        <div
          className={cn(
            'flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full',
            isAlmostExpired
              ? 'bg-amber-100 text-amber-700'
              : 'bg-muted text-muted-foreground'
          )}
        >
          <Clock className="w-3 h-3" />
          Expires in {formatCountdown(secondsLeft)}
        </div>
      </div>
    </div>
  )
}
