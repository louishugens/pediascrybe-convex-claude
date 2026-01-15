'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useForm } from 'react-hook-form';
import * as yup from "yup";
import { yupResolver } from '@hookform/resolvers/yup';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, Suspense } from "react";
import BeatLoader from 'react-spinners/BeatLoader';
import { authClient } from '@/lib/auth-client';
import { toast } from 'sonner';
import { Lock, ArrowRight, CheckCircle, ShieldCheck, Eye, EyeOff } from 'lucide-react';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [loading, setLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const router = useRouter()

  const schema = yup.object({
    password: yup.string().min(8, 'Password must be at least 8 characters').required('Please enter your password'),
    confirmPassword: yup.string()
      .oneOf([yup.ref('password'), null], 'Passwords must match')
      .required('Please confirm your password'),
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
    if (!token) {
      setErrorMsg('Invalid reset link. Please request a new password reset.')
      return
    }

    setLoading(true)
    setErrorMsg(null)
    
    const { error } = await authClient.resetPassword({
      newPassword: values.password,
      token: token,
    })

    if (error) {
      setErrorMsg(error.message || 'Failed to reset password')
      toast.error(error.message || 'Failed to reset password')
      setLoading(false)
      return
    }

    setResetSuccess(true)
    setLoading(false)
    toast.success('Password reset successfully!')
    
    setTimeout(() => {
      router.push('/')
    }, 2000)
  }

  if (!token) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-6">
          <ShieldCheck className="w-8 h-8 text-destructive" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">Invalid Reset Link</h3>
        <p className="text-muted-foreground mb-6">
          This password reset link is invalid or has expired.
        </p>
        <Link 
          href="/reset" 
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all"
        >
          Request New Link
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    )
  }

  if (resetSuccess) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">Password Reset!</h3>
        <p className="text-muted-foreground mb-2">
          Your password has been reset successfully.
        </p>
        <p className="text-sm text-muted-foreground">
          Redirecting to login...
        </p>
      </div>
    )
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">New Password</label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input 
            placeholder="Min. 8 characters" 
            className="w-full pl-12 pr-12 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" 
            type={showPassword ? "text" : "password"} 
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {errors.password && <p className="text-sm text-destructive">{errors.password?.message}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Confirm Password</label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input 
            placeholder="Confirm your password" 
            className="w-full pl-12 pr-12 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" 
            type={showConfirmPassword ? "text" : "password"} 
            {...register('confirmPassword')}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword?.message}</p>}
      </div>

      {errorMsg && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <p className="text-sm text-destructive">{errorMsg}</p>
        </div>
      )}

      <button 
        className="w-full py-3.5 px-4 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all flex items-center justify-center gap-2 group mt-2" 
        type="submit"
        disabled={loading}
      >
        {loading ? (
          <BeatLoader color="#ffffff" size={10} />
        ) : (
          <>
            Reset Password
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </>
        )}
      </button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24 pt-20 pb-12">
        <div className="w-full max-w-md mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
              <Lock className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Create new password
            </h1>
            <p className="text-muted-foreground">
              Your new password must be at least 8 characters long.
            </p>
          </div>

          <Suspense fallback={
            <div className="flex items-center justify-center py-12">
              <BeatLoader color="#6366f1" size={12} />
            </div>
          }>
            <ResetPasswordForm />
          </Suspense>

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
      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-20 right-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-primary/30 rounded-full blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center p-12 w-full">
          {/* Doctor Image */}
          <div className="relative mb-8">
            <div className="relative w-64 h-64 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/50">
              <Image
                src="https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=500&h=500&fit=crop&crop=face"
                alt="Doctor"
                fill
                className="object-cover"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/30 to-transparent" />
            </div>
            
            {/* Floating Icon */}
            <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
          </div>

          {/* Text */}
          <div className="text-center max-w-xs">
            <h3 className="text-xl font-bold text-foreground mb-2">Almost There!</h3>
            <p className="text-muted-foreground text-sm">
              Create a strong password to keep your account secure. We recommend using a mix of letters, numbers, and symbols.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
