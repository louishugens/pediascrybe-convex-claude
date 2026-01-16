'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useForm } from 'react-hook-form';
import * as yup from "yup";
import { yupResolver } from '@hookform/resolvers/yup';
import { useState } from "react";
import BeatLoader from 'react-spinners/BeatLoader';
import { authClient } from '@/lib/auth-client';
import { toast } from 'sonner';
import { KeyRound, Mail, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ResetPage() {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false)

  const schema = yup.object({
    email: yup.string().email('Invalid email').required('Please enter your email'),
  }).required();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema)
  });
  
  const onSubmit = data => handleReset(data);

  const handleReset = async (values) => {
    setLoading(true)
    
    const { error } = await authClient.forgetPassword({
      email: values.email,
      redirectTo: `${window.location.origin}/reset/password`,
    })

    if (error) {
      toast.error(error.message || 'Failed to send reset email')
      setLoading(false)
      return
    }

    setEmailSent(true)
    setLoading(false)
    toast.success('Reset email sent! Please check your inbox.')
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24 pt-20 pb-12">
        <div className="w-full max-w-md mx-auto">
          {/* Back Link */}
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>

          {/* Header */}
          <div className="mb-8">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
              <KeyRound className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Reset password
            </h1>
            <p className="text-muted-foreground">
              Enter your email and we&apos;ll send you a link to reset your password.
            </p>
          </div>

          {emailSent ? (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Check your email</h3>
                    <p className="text-sm text-muted-foreground">
                      We&apos;ve sent you a password reset link. Click the link in the email to reset your password.
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Didn&apos;t receive the email?
                </p>
                <button 
                  onClick={() => setEmailSent(false)}
                  className="text-primary font-medium hover:underline"
                >
                  Try again
                </button>
              </div>
            </div>
          ) : (
            <form className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input 
                    placeholder="you@example.com" 
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" 
                    type="email" 
                    {...register('email')}
                  />
                </div>
                {errors.email && <p className="text-sm text-destructive">{errors.email?.message}</p>}
              </div>

              <button 
                className="w-full py-3.5 px-4 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all flex items-center justify-center gap-2 group" 
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <BeatLoader color="#ffffff" size={10} />
                ) : (
                  <>
                    Send Reset Link
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer */}
          <p className="text-center mt-8 text-sm text-muted-foreground">
            Remember your password?{' '}
            <Link href="/" className="text-primary font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Decorative */}
      <div className="hidden lg:flex flex-1 relative bg-linear-to-br from-primary/5 via-primary/10 to-primary/5 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-20 right-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-primary/30 rounded-full blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center p-12 w-full">
          {/* Illustration */}
          <div className="relative mb-8">
            <div className="relative w-64 h-64 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/50">
              <Image
                src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=500&h=500&fit=crop&crop=face"
                alt="Doctor"
                fill
                className="object-cover"
                unoptimized
              />
              <div className="absolute inset-0 bg-linear-to-t from-primary/30 to-transparent" />
            </div>
            
            {/* Floating Icon */}
            <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center">
              <KeyRound className="w-8 h-8 text-primary" />
            </div>
          </div>

          {/* Text */}
          <div className="text-center max-w-xs">
            <h3 className="text-xl font-bold text-foreground mb-2">Secure & Quick</h3>
            <p className="text-muted-foreground text-sm">
              Your account security is our priority. Reset your password securely in just a few steps.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
