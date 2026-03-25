'use client'

import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import {
  Smartphone,
  QrCode,
  Link2,
  Loader2,
  CheckCircle,
  MessageSquare,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { WhatsAppQRCode } from '@/components/whatsapp/WhatsAppQRCode'
import { WhatsAppLinkStatus } from '@/components/whatsapp/WhatsAppLinkStatus'
import { WhatsAppUnlinkButton } from '@/components/whatsapp/WhatsAppUnlinkButton'

export default function WhatsAppSettingsPage() {
  const [isLinking, setIsLinking] = useState(false)
  const [isUnlinking, setIsUnlinking] = useState(false)

  const linkStatus = useQuery(api.whatsappLinks.getLinkStatus)
  const generateLinkToken = useMutation(api.whatsappLinks.generateLinkToken)
  const unlinkWhatsApp = useMutation(api.whatsappLinks.unlinkWhatsApp)

  const handleLink = async () => {
    setIsLinking(true)
    try {
      await generateLinkToken()
      toast.success('QR code generated — scan it with your phone')
    } catch (error) {
      console.error('Failed to generate link token:', error)
      toast.error('Failed to generate QR code. Please try again.')
    } finally {
      setIsLinking(false)
    }
  }

  const handleUnlink = async () => {
    setIsUnlinking(true)
    try {
      await unlinkWhatsApp()
      toast.success('WhatsApp has been unlinked from your account')
    } catch (error) {
      console.error('Failed to unlink WhatsApp:', error)
      toast.error('Failed to unlink WhatsApp. Please try again.')
    } finally {
      setIsUnlinking(false)
    }
  }

  if (linkStatus === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const status = linkStatus?.status ?? 'unlinked'
  const isActive = status === 'active'
  const isPending = status === 'pending'
  const isUnlinked = status === 'unlinked'

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">WhatsApp ScrybeGPT</h1>
        <p className="text-muted-foreground">
          Link your WhatsApp number to use ScrybeGPT as an AI assistant directly in your chat
        </p>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
                  isActive
                    ? 'bg-green-100 text-green-600'
                    : isPending
                    ? 'bg-amber-100 text-amber-600'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <CardTitle>Connection Status</CardTitle>
                <CardDescription>
                  {isActive
                    ? 'Your WhatsApp is connected and ScrybeGPT is ready to use'
                    : isPending
                    ? 'Scan the QR code below with your phone camera to link WhatsApp'
                    : 'Connect your WhatsApp to start using ScrybeGPT'}
                </CardDescription>
              </div>
            </div>

            <div className="shrink-0">
              <WhatsAppLinkStatus
                status={status}
                phoneNumber={isActive && linkStatus ? (linkStatus as any).phoneNumber : undefined}
                linkedAt={isActive && linkStatus ? (linkStatus as any).linkedAt : undefined}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Active state */}
          {isActive && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-green-50 border border-green-100 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    WhatsApp linked successfully
                  </p>
                  <p className="text-sm text-green-700 mt-0.5">
                    Send a message to ScrybeGPT on WhatsApp to get AI-powered medical
                    assistance anytime, from your phone.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Linked number</p>
                  <p className="font-medium text-foreground mt-0.5">
                    {(linkStatus as { status: 'active'; phoneNumber: string }).phoneNumber}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Linked on</p>
                  <p className="font-medium text-foreground mt-0.5">
                    {new Date(
                      (linkStatus as { status: 'active'; linkedAt: number }).linkedAt
                    ).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <WhatsAppUnlinkButton
                  onUnlink={handleUnlink}
                  isLoading={isUnlinking}
                />
              </div>
            </div>
          )}

          {/* Pending state */}
          {isPending && (
            <div className="space-y-4">
              <WhatsAppQRCode
                token={(linkStatus as { status: 'pending'; linkToken: string; expiresAt: number }).linkToken}
                expiresAt={(linkStatus as { status: 'pending'; expiresAt: number }).expiresAt}
                onExpired={() => toast.info('QR code expired. Generate a new one to continue.')}
                onRefresh={handleLink}
              />

              <div className="p-4 rounded-xl bg-muted/50 border space-y-2">
                <p className="text-sm font-medium text-foreground">How to link</p>
                <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside">
                  <li>Open your <strong>phone camera</strong> (not WhatsApp)</li>
                  <li>Point it at the QR code above</li>
                  <li>Tap the notification that appears — it will open WhatsApp with a pre-filled message</li>
                  <li>Tap <strong>Send</strong> to confirm the link</li>
                </ol>
                <p className="text-xs text-muted-foreground/70 mt-2">
                  The QR code opens a WhatsApp chat with ScrybeGPT and sends a one-time link code automatically.
                </p>
              </div>

              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  onClick={handleLink}
                  disabled={isLinking}
                  className="text-muted-foreground gap-2"
                >
                  {isLinking ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <QrCode className="w-4 h-4" />
                  )}
                  Regenerate QR code
                </Button>
              </div>
            </div>
          )}

          {/* Unlinked state */}
          {isUnlinked && (
            <div className="flex flex-col items-center gap-6 py-4">
              <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center">
                <QrCode className="w-10 h-10 text-muted-foreground/50" />
              </div>
              <div className="text-center space-y-1">
                <p className="font-medium text-foreground">No WhatsApp linked</p>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Generate a QR code and scan it with your WhatsApp to connect your
                  number to ScrybeGPT.
                </p>
              </div>
              <Button
                onClick={handleLink}
                disabled={isLinking}
                className="gap-2"
              >
                {isLinking ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Link2 className="w-4 h-4" />
                )}
                Link WhatsApp
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-foreground">About WhatsApp ScrybeGPT</h3>
              <p className="text-sm text-muted-foreground">
                Once linked, you can message ScrybeGPT on WhatsApp to get instant answers
                about your patients, look up medical guidelines, or get help drafting notes —
                all without opening the app.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {['Patient lookup', 'Drug references', 'Clinical guidelines', 'Appointment info'].map(
                  (tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-xs font-normal"
                    >
                      {tag}
                    </Badge>
                  )
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
