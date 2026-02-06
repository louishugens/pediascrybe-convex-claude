"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import { useState, Suspense } from "react"
import { CheckCircle2, XCircle, ArrowRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

function JoinContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token") || ""
  const [accepting, setAccepting] = useState(false)

  const validation = useQuery(api.invitations.validateInvitation, { token })
  const acceptInvitation = useMutation(api.invitations.acceptInvitation)
  const { data: session } = authClient.useSession()

  const handleAccept = async () => {
    if (!token) return
    setAccepting(true)
    try {
      await acceptInvitation({ token })
      toast.success("Invitation accepted! Welcome to the Parent Portal.")
      router.push("/portal")
    } catch (error: any) {
      toast.error(error.message || "Failed to accept invitation")
    } finally {
      setAccepting(false)
    }
  }

  // Loading state
  if (validation === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  // Invitation already accepted — show success message instead of error
  if (!validation.valid && validation.error?.includes("accepted")) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Invitation Already Accepted</h1>
          <p className="text-muted-foreground">
            This invitation has already been linked to your account. Sign in to access the Parent Portal.
          </p>
          <Button asChild>
            <Link href="/">Sign In</Link>
          </Button>
        </div>
      </div>
    )
  }

  // Invalid token
  if (!validation.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <XCircle className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold">Invalid Invitation</h1>
          <p className="text-muted-foreground">{validation.error}</p>
          <Button asChild>
            <Link href="/">Go to Home</Link>
          </Button>
        </div>
      </div>
    )
  }

  // Valid token but not logged in — redirect to signup
  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center">
            <Image
              src="/logo.png"
              alt="Pediascrybe"
              width={180}
              height={50}
              className="mx-auto mb-6"
            />
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">You&apos;re Invited!</h1>
            <p className="text-muted-foreground">
              <strong>{validation.invitation?.doctorName}</strong> has invited you to view{" "}
              <strong>{validation.invitation?.patientName}</strong>&apos;s health records.
            </p>
          </div>

          <div className="bg-muted/50 rounded-xl p-4 space-y-2">
            <p className="text-sm text-muted-foreground">
              To access the Parent Portal, you need to create an account or sign in.
            </p>
          </div>

          <div className="space-y-3">
            <Button className="w-full" size="lg" asChild>
              <Link href={`/portal/signup?token=${token}&email=${encodeURIComponent(validation.invitation?.email || "")}`}>
                Create Account
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button variant="outline" className="w-full" size="lg" asChild>
              <Link href={`/?redirect=/portal/join?token=${token}`}>
                Sign In
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Valid token and logged in — show accept button
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <Image
            src="/logo.png"
            alt="Pediascrybe"
            width={180}
            height={50}
            className="mx-auto mb-6"
          />
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Accept Invitation</h1>
          <p className="text-muted-foreground">
            <strong>{validation.invitation?.doctorName}</strong> has invited you to view{" "}
            <strong>{validation.invitation?.patientName}</strong>&apos;s health records on the Parent Portal.
          </p>
        </div>

        <Button
          className="w-full"
          size="lg"
          onClick={handleAccept}
          disabled={accepting}
        >
          {accepting ? <Spinner /> : "Accept Invitation"}
          {!accepting && <ArrowRight className="w-4 h-4 ml-2" />}
        </Button>
      </div>
    </div>
  )
}

export default function JoinPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    }>
      <JoinContent />
    </Suspense>
  )
}
