'use client'
import Link from 'next/link';
import { CheckCircle2, Mail, ArrowRight, Heart } from 'lucide-react';

export default function PatientSignupSuccess() {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Content */}
      <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24 pt-20 pb-12">
        <div className="w-full max-w-md mx-auto text-center">
          {/* Success Icon */}
          <div className="relative mb-8 inline-block">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-primary" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Heart className="w-4 h-4 text-primary" />
            </div>
          </div>

          {/* Header */}
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Account Created!
          </h1>
          <p className="text-muted-foreground mb-8">
            You&apos;re almost ready to access the Parent Portal.
          </p>

          {/* Email Verification Card */}
          <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Check your inbox</h3>
            <p className="text-sm text-muted-foreground">
              We&apos;ve sent a verification email to your inbox. Please click the link in the email to verify your account, then sign in to access your child&apos;s health records.
            </p>
          </div>

          {/* CTA */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all group"
          >
            Go to Sign In
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          {/* Help Text */}
          <p className="text-sm text-muted-foreground mt-8">
            Didn&apos;t receive the email? Check your spam folder or try signing up again.
          </p>
        </div>
      </div>

      {/* Right Side - Decorative */}
      <div className="hidden lg:flex flex-1 relative bg-linear-to-br from-primary/5 via-primary/10 to-primary/5 overflow-hidden">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-20 right-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-center items-center p-12 w-full">
          <div className="text-center max-w-xs">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-6">
              <Heart className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-3">Parent Portal</h3>
            <p className="text-muted-foreground text-sm mb-8">
              Stay connected to your child&apos;s health journey.
            </p>

            <div className="space-y-4 text-left">
              {[
                "View appointment summaries",
                "Print prescriptions and lab exams",
                "Track vaccination progress",
                "View growth charts",
              ].map((benefit, idx) => (
                <div key={idx} className="flex items-center gap-3 text-primary/90">
                  <div className="w-2 h-2 rounded-full bg-primary/60 shrink-0" />
                  <span className="text-sm">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
