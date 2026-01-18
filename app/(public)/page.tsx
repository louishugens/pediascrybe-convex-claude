'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from 'sonner'
import posthog from 'posthog-js';
import { authClient } from '@/lib/auth-client';
import { Stethoscope, Shield, Clock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

const FormSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string({error: (issue) => issue.input === undefined ? 
    "Please enter your password" :
    "Not a string" 
    }).min(4, 'Password must be more that 4 character'),
});

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const router = useRouter()

  type FormData = z.infer<typeof FormSchema>

  const {register, handleSubmit, formState:{errors}, reset} = useForm<FormData>({
    resolver: zodResolver(FormSchema),
  })

  const onSubmit = (data: FormData) => authenticateUser(data);

  const authenticateUser = async (values: FormData) => {
    setLoading(true)
    setErrorMsg(null)
    
    const { data, error } = await authClient.signIn.email({
      email: values.email,
      password: values.password,
    })
    
    if (error) {
      toast.error(error.message || 'Sign in failed')
      setErrorMsg(error.message || 'Sign in failed')
      setLoading(false)
      return
    }
    
    if (data?.user) {
      posthog.identify(data.user.email)
      setLoading(false)
      toast.success('Sign in successful')
      reset()
      router.push('/user')
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24 pt-20 pb-12">
        <div className="w-full max-w-md mx-auto">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Welcome back
            </h1>
            <p className="text-muted-foreground">
              Sign in to your Pediascrybe account
            </p>
          </div>

          {/* Mobile Notice */}
          <div className="md:hidden mb-8 p-4 rounded-xl bg-primary/5 border border-primary/10">
            <p className="text-sm font-semibold text-foreground mb-2">🌟 Better on Desktop</p>
            <p className="text-xs text-muted-foreground">For the best experience, access Pediascrybe from your laptop or desktop computer.</p>
          </div>

          {/* Form */}
          <form className='flex flex-col gap-5' onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <input 
                placeholder='you@example.com' 
                className='w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all' 
                type='email' 
                {...register('email')}
              />
              {errors.email && <p className='text-sm text-destructive'>{errors.email?.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Password</label>
              <div className="relative">
                <input 
                  placeholder='Enter your password' 
                  className='w-full px-4 py-3 pr-12 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all' 
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
              {errors.password && <p className='text-sm text-destructive'>{errors.password?.message}</p>}
            </div>

            <div className="flex justify-end">
              <Link href={'/reset' as any} className="text-sm text-primary hover:text-primary/80 transition-colors">
                Forgot password?
              </Link>
            </div>

            <Button 
              className='py-4' 
              size='lg'
              type='submit'
              disabled={loading}
            >
            Sign In
            {loading ? <Spinner /> : <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />}
       
            </Button>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className='text-sm text-destructive'>{errorMsg}</p>
              </div>
            )}
          </form>

          {/* Sign Up Link */}
          <p className='text-center mt-8 text-muted-foreground'>
            Don&apos;t have an account?{' '}
            <Link href={"/signup" as any} className='text-primary font-semibold hover:underline'>
              Create one
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Decorative */}
      <div className="hidden lg:flex flex-1 relative bg-linear-to-br from-primary/5 via-primary/10 to-primary/5 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/30 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-primary/10 rounded-full blur-2xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center p-12 w-full">
          {/* Doctor Images Grid */}
          <div className="relative mb-12">
            <div className="flex gap-4 items-end">
              {/* First Doctor Image */}
              <div className="relative w-48 h-64 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/50 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
                <Image
                  src="/doctor-female-black.jpg"
                  alt="Doctor"
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute inset-0 bg-linear-to-t from-primary/40 to-transparent" />
              </div>
              {/* Second Doctor Image */}
              <div className="relative w-56 h-72 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/50 transform rotate-2 hover:rotate-0 transition-transform duration-300">
                <Image
                  src="/doctor-male-white.jpg"
                  alt="Doctor"
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute inset-0 bg-linear-to-t from-primary/40 to-transparent" />
              </div>
            </div>

            {/* Floating Badge */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white rounded-full px-6 py-3 shadow-lg flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-sm font-medium text-foreground">Built with pediatricians</span>
            </div>
          </div>

          {/* Features */}
          <div className="grid gap-4 max-w-sm">
            <div className="flex items-center gap-4 bg-white/80 backdrop-blur rounded-xl p-4 shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">AI-Powered Insights</h3>
                <p className="text-xs text-muted-foreground">Smart diagnostics assistance</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white/80 backdrop-blur rounded-xl p-4 shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">HIPAA Compliant</h3>
                <p className="text-xs text-muted-foreground">Secure patient data management</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white/80 backdrop-blur rounded-xl p-4 shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">Save Hours Daily</h3>
                <p className="text-xs text-muted-foreground">Streamlined documentation</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
