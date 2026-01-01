'use client'
import Link from 'next/link'
import Doctor from '@/components/doctor'
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useState } from "react";
import BeatLoader from 'react-spinners/BeatLoader';
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from 'sonner'
import posthog from 'posthog-js';
import { authClient } from '@/lib/auth-client';


const FormSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string({error: (issue) => issue.input === undefined ? 
    "Please enter your password" :
    "Not a string" 
    }).min(4, 'Password must be more that 4 character'),
});

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [color] = useState("#ffffff");
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const router = useRouter()

  type FormData = z.infer<typeof FormSchema>

  const {register, handleSubmit, formState:{errors}} = useForm<FormData>({
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
      router.push('/user')
    }
  }


  return (
    <div className="pt-12 pb-2 px-8 md:px-16">
      <div className='flex flex-col md:flex-row pt-4'>
        <div className=" w-full md:basis-1/2">
          <h2 className='text-3xl text-slate-900 font-bold'>Log <span className='text-primary'>In</span></h2>
          <p className='text-slate-900 text-sm'>
            Don&apos;t have an account yet? 
            <Link href={"/signup" as any} className='text-primary font-semibold'> Sign up</Link>
          </p>
          {/* <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="w-full md:w-1/2 space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="jdoe@gmail.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input placeholder="your password" {...field} type='password'/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex flex-row w-full justify-center">
                <button className="py-2 px-4 rounded-full bg-indigo-700 text-white text-lg font-semibold w-fit center mt-4 mx-auto" type='submit'>
                  {
                    loading
                    ?
                    <BeatLoader
                      color={color}
                      size={10}
                      aria-label="Loading Spinner"
                      data-testid="loader"
                    />
                    :
                      "Signin"
                  }
                </button>
              </div>

            </form>
          </Form> */}

          <p className='text-slate-900 text-sm font-bold mt-16 md:hidden'>🌟 Unlock a Richer Experience: Connect from Your Laptop! 🌟</p>
          <p className='text-slate-900 text-sm mt-4 md:hidden'>👋 Hello there! We&apos;re thrilled to invite you to a whole new level of engagement and convenience. 🚀 While our mobile app offers the portability you love, we&apos;re excited to share that a world of enhanced features and capabilities awaits you when you connect using your laptop!</p>
          <p className='text-slate-900 text-sm mt-4 md:hidden'>See you on the larger side of life! 🎉</p>
          <form className='md:flex flex-col mt-16 text-sm hidden' onSubmit={handleSubmit(onSubmit)}>
            <label className="flex flex-col mb-4 h-16">
              <span className='font-medium'>Email</span>
              <input placeholder='johndoe@example.com' className='placeholder:italic placeholder:text-sm bg-white shadow-md rounded-full py-2 px-4' type='email' {...register('email')}/>
              <p className='px-4 pt-1 text-sm text-red-600'>{errors.email?.message}</p>
            </label>
            <label className="flex flex-col mb-4">
              <span className='font-medium'>Password</span>
              <input placeholder='your password' className='placeholder:italic placeholder:text-sm bg-white shadow-md rounded-full py-2 px-4' type='password' {...register('password')}/>
              <p className='px-4 pt-1 text-sm text-red-600'>{errors.password?.message}</p>
            </label>
            <button className='py-2 px-4 rounded-full bg-primary text-lg text-white font-semibold w-1/2 center mt-4 mx-auto' type='submit'>
              {
                loading
                ?
                <BeatLoader
                  color={color}
                  size={10}
                  aria-label="Loading Spinner"
                  data-testid="loader"
                />
                :
                  "Log in"}
            </button>
            <p className='text-sm mt-4 mx-auto text-slate-900'>You forgot your password? <Link href={'/reset' as any} className="text-primary font-medium" >Reset it here!</Link></p>
            {errorMsg && <p className='text-sm mt-4 mx-auto font-medium text-red-500'>{errorMsg}</p>}
          </form>
          
          
          
        </div>
        <div className="md:basis-1/2 w-full relative">
          {/* <Image src={Doctor} alt='Doctor' /> */}
          <Doctor />
        </div>
      </div>
    </div>
  )
}
