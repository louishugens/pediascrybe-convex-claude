'use client'
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle2, Mail, ArrowRight, Sparkles } from 'lucide-react';

export default function SignupSuccess() {
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
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
          </div>

          {/* Header */}
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Welcome to Pediascrybe!
          </h1>
          <p className="text-muted-foreground mb-8">
            Your account has been created successfully.
          </p>

          {/* Email Verification Card */}
          <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Check your inbox</h3>
            <p className="text-sm text-muted-foreground">
              We&apos;ve sent a verification email to your inbox. Please click the link in the email to verify your account and start using Pediascrybe.
            </p>
          </div>

          {/* CTA */}
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all group"
          >
            Go to Login
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          {/* Help Text */}
          <p className="text-sm text-muted-foreground mt-8">
            Didn&apos;t receive the email?{' '}
            <button className="text-primary font-medium hover:underline">
              Resend verification
            </button>
          </p>
        </div>
      </div>

      {/* Right Side - Decorative */}
      <div className="hidden lg:flex flex-1 relative bg-linear-to-br from-primary/5 via-primary/10 to-primary/5 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-20 right-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center p-12 w-full">
          {/* Celebration Image */}
          <div className="relative mb-8">
            <div className="flex gap-4 items-end">
              <div className="relative w-40 h-52 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/50 transform -rotate-6 hover:rotate-0 transition-transform duration-300">
                <Image
                  src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&h=400&fit=crop&crop=face"
                  alt="Doctor"
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute inset-0 bg-linear-to-t from-primary/30 to-transparent" />
              </div>
              <div className="relative w-48 h-60 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/50 transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <Image
                  src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&h=400&fit=crop&crop=face"
                  alt="Doctor"
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute inset-0 bg-linear-to-t from-primary/30 to-transparent" />
              </div>
            </div>

            {/* Success Badge */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-full px-6 py-3 shadow-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-foreground">Account Created!</span>
            </div>
          </div>

          {/* Text */}
          <div className="text-center max-w-xs mt-8">
            <h3 className="text-xl font-bold text-foreground mb-2">You&apos;re all set!</h3>
            <p className="text-muted-foreground text-sm">
              Join hundreds of pediatricians who are already using Pediascrybe to enhance their practice.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
