'use client'
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import * as yup from "yup";
import { yupResolver } from '@hookform/resolvers/yup';
import PulseLoader from "react-spinners/PulseLoader"
import { useRouter } from 'next/navigation';
import posthog from 'posthog-js';
import { authClient } from '@/lib/auth-client';
import { toast } from 'sonner';
import { UserPlus, CheckCircle2, ArrowRight, Sparkles, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

export default function Signup() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<{ message?: string } | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const schema = yup.object({
    firstname: yup.string().required('Please enter your first name'),
    lastname: yup.string().required('Please enter your last name'),
    email: yup.string().email('Invalid email').required('Please enter your email'),
    password: yup.string().min(8, 'Password must be at least 8 characters').required('Please enter your password'),
    terms: yup.boolean().required('Please confirm you read and accept the terms').oneOf([true], "The terms and conditions must be accepted.")
  }).required();

  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema)
  });

  const onSubmit = (data) => createUser(data);

  const createUser = async (values) => {
    setLoading(true)
    setError(null)

    const { firstname, lastname, email, password } = values
    
    const { data, error } = await authClient.signUp.email({
      email: email,
      password: password,
      name: `${firstname} ${lastname}`,
      firstName: firstname,
      lastName: lastname,
      role: "doctor",
    })

    if (error) {
      setError(error)
      toast.error(error.message || 'Sign up failed')
      setLoading(false)
      return
    }

    if (data?.user) {
      try {
        await fetch('/api/send', {
          method: 'POST',
          body: JSON.stringify({ email, lastname }),
        })
      } catch (e) {
        console.log('Email send error:', e);
      }
      
      posthog.capture('Signup success')
      router.push('/signup/success' as any)
    }
  }

  const benefits = [
    "AI-powered clinical documentation",
    "Smart patient data management",
    "Growth charts and analytics",
    "Secure prescription generation"
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Decorative */}
      <div className="hidden lg:flex flex-1 relative bg-linear-to-br from-primary/5 via-primary/10 to-primary/5 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/30 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-primary/10 rounded-full blur-2xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center p-12 w-full">
          <div className="max-w-md">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-primary">Join Pediascrybe</h2>
                <p className="text-primary/70 text-sm">Elevate your pediatric practice</p>
              </div>
            </div>

            {/* Benefits */}
            <div className="space-y-4 mb-12">
              {benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-center gap-3 text-primary/90">
                  <CheckCircle2 className="w-5 h-5 text-primary/80 shrink-0" />
                  <span className="text-sm">{benefit}</span>
                </div>
              ))}
            </div>

            {/* Doctor Images */}
            <div className="relative">
              <div className="flex gap-3">
                <div className="relative w-32 h-40 rounded-xl overflow-hidden border-2 border-white/50 transform -rotate-6">
                  <Image
                    src="/doctor-female-white.jpg"
                    alt="Pediatrician"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="relative w-32 h-40 rounded-xl overflow-hidden border-2 border-white/50 transform rotate-3 translate-y-4">
                  <Image
                    src="/doctor-male-black.jpg"
                    alt="Pediatrician"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              </div>
              
              {/* Stats Badge */}
              <div className="absolute -bottom-6 -right-4 bg-white rounded-xl px-4 py-3 shadow-xl">
                <p className="text-2xl font-bold text-primary">500+</p>
                <p className="text-xs text-muted-foreground">Active doctors</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-20 pt-20 pb-12 bg-background">
        <div className="w-full max-w-md mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Create your account
            </h1>
            <p className="text-muted-foreground">
              Already have an account?{' '}
              <Link href="/" className="text-primary font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>

          {/* Mobile Notice */}
          <div className="md:hidden mb-6 p-4 rounded-xl bg-primary/5 border border-primary/10">
            <p className="text-sm font-semibold text-foreground mb-1">🌟 Better on Desktop</p>
            <p className="text-xs text-muted-foreground">For the best experience, access Pediascrybe from your laptop.</p>
          </div>

          {/* Form */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <PulseLoader
                color="#6366f1"
                loading={loading}
                size={15}
              />
            </div>
          ) : (
            <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">First name</label>
                  <input
                    placeholder="John"
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    type="text"
                    {...register('firstname')}
                  />
                  {errors?.firstname && <p className="text-xs text-destructive">{errors?.firstname?.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Last name</label>
                  <input
                    placeholder="Doe"
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    type="text"
                    {...register('lastname')}
                  />
                  {errors?.lastname && <p className="text-xs text-destructive">{errors?.lastname?.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email</label>
                <input
                  placeholder="you@clinic.com"
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  type="email"
                  {...register('email')}
                />
                {errors.email && <p className="text-xs text-destructive">{errors?.email?.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Password</label>
                <div className="relative">
                  <input
                    placeholder="Min. 8 characters"
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    type={showPassword ? "text" : "password"}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors?.password && <p className="text-xs text-destructive">{errors?.password?.message}</p>}
              </div>

              <div className="flex items-start gap-3 mt-2">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    id="terms"
                    className="peer sr-only"
                    {...register('terms')}
                  />
                  <label 
                    htmlFor="terms"
                    className="w-5 h-5 rounded-md border border-input bg-background flex items-center justify-center cursor-pointer peer-checked:bg-primary peer-checked:border-primary transition-all"
                  >
                    <svg className="w-3 h-3 text-white hidden peer-checked:block" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </label>
                </div>
                <label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer">
                  I agree to the{' '}
                  <Link href={"/terms" as any} className="text-primary font-medium hover:underline">
                    Terms and Conditions
                  </Link>
                </label>
              </div>
              {errors?.terms && <p className="text-xs text-destructive">{errors.terms?.message}</p>}
              {error && <p className="text-xs text-destructive">{error.message}</p>}

              <Button 
                className="py-4" 
                size='lg'
                type="submit"
                disabled={loading}
              >
                Create Account
                {loading ? <Spinner /> : <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
