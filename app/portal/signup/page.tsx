"use client"

import { useState, Suspense } from "react"
import Link from "next/link"
import Image from "next/image"
import { useForm } from "react-hook-form"
import { useSearchParams, useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"
import { UserPlus, ArrowRight, Eye, EyeOff, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

const FormSchema = z.object({
  firstname: z.string().min(1, "Please enter your first name"),
  lastname: z.string().min(1, "Please enter your last name"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

type FormData = z.infer<typeof FormSchema>

function SignupContent() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token") || ""
  const prefillEmail = searchParams.get("email") || ""

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: prefillEmail,
    },
  })

  const onSubmit = async (values: FormData) => {
    setLoading(true)
    setError(null)

    const { data, error } = await authClient.signUp.email({
      email: values.email,
      password: values.password,
      name: `${values.firstname} ${values.lastname}`,
      firstName: values.firstname,
      lastName: values.lastname,
      role: "patient",
    })

    if (error) {
      setError(error.message || "Sign up failed")
      toast.error(error.message || "Sign up failed")
      setLoading(false)
      return
    }

    if (data?.user) {
      toast.success("Account created successfully!")
      router.push("/portal/signup/success")
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Decorative */}
      <div className="hidden lg:flex flex-1 relative bg-linear-to-br from-primary/5 via-primary/10 to-primary/5 overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/30 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-center p-12 w-full">
          <div className="max-w-md">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <Heart className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-primary">Parent Portal</h2>
                <p className="text-primary/70 text-sm">Stay connected to your child&apos;s health</p>
              </div>
            </div>

            <div className="space-y-4 mb-12">
              {[
                "View appointment summaries and medical notes",
                "Print prescriptions and lab exam requests",
                "Track vaccination progress",
                "View growth charts",
                "Upload documents for your doctor",
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

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-20 pt-20 pb-12 bg-background">
        <div className="w-full max-w-md mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Create your parent account
            </h1>
            <p className="text-muted-foreground">
              Already have an account?{" "}
              <Link
                href={token ? `/?redirect=/portal/join?token=${token}` : "/"}
                className="text-primary font-semibold hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>

          <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">First name</label>
                <input
                  placeholder="Marie"
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  type="text"
                  {...register("firstname")}
                />
                {errors.firstname && (
                  <p className="text-xs text-destructive">{errors.firstname.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Last name</label>
                <input
                  placeholder="Doe"
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  type="text"
                  {...register("lastname")}
                />
                {errors.lastname && (
                  <p className="text-xs text-destructive">{errors.lastname.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <input
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                type="email"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Password</label>
              <div className="relative">
                <input
                  placeholder="Min. 8 characters"
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button className="py-4" size="lg" type="submit" disabled={loading}>
              Create Account
              {loading ? <Spinner /> : <ArrowRight className="w-4 h-4" />}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function PortalSignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    }>
      <SignupContent />
    </Suspense>
  )
}
