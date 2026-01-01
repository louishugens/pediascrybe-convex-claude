'use client'
import Link from 'next/link'
import Doctor from '@/components/doctor'
import { useForm } from 'react-hook-form';
import * as yup from "yup";
import { yupResolver } from '@hookform/resolvers/yup';
import { useState } from "react";
import BeatLoader from 'react-spinners/BeatLoader';
import { authClient } from '@/lib/auth-client';
import { toast } from 'sonner';

export default function ResetPage() {
  const [loading, setLoading] = useState(false);
  const [color] = useState("#ffffff");
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
    <div className="pt-12 pb-2 px-8 md:px-16">
      <div className='flex flex-col md:flex-row pt-4'>
        <div className="md:basis-1/2 w-full">
          <h2 className='text-3xl text-slate-900 font-bold'>Reset <span className='text-primary'>password</span></h2>
          <p className='text-slate-900 text-sm'>Don&apos;t have an account yet? <Link href="/signup" className='text-primary font-semibold'>Sign up</Link></p>
          <form className='flex flex-col mt-16 text-sm' onSubmit={handleSubmit(onSubmit)}>
            <p className='mb-8'>To reset your password please confirm your email first</p>
            {
              emailSent
              ?
                <div className="text-center">
                  <p className="text-green-600 font-medium">Email sent! Please check your inbox.</p>
                  <p className="text-sm text-gray-600 mt-2">Click the link in the email to reset your password.</p>
                </div>
              :
                <label className="flex flex-col mb-4 h-16">
                  <span className='font-medium'>Email</span>
                  <input 
                    placeholder='johndoe@example.com' 
                    className='placeholder:italic placeholder:text-sm bg-white shadow-md rounded-full py-2 px-4' 
                    type='email' 
                    {...register('email')}
                  />
                  <p className='px-4 pt-1 text-sm text-red-600'>{errors.email?.message}</p>
                </label>
            }
            {!emailSent && (
              <button className='py-2 px-4 rounded-full bg-primary text-lg font-semibold w-1/2 center mt-4 mx-auto' type='submit'>
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
                    "Submit"
                }
              </button>
            )}
            <p className='text-sm mt-4 mx-auto text-slate-900'>You remember your password? <Link href='/' className="text-primary font-medium">Log in here!</Link></p>
          </form>
        </div>
        <div className="basis-1/2">
          <Doctor />
        </div>
      </div>
    </div>
  )
}
