'use client'
import Link from 'next/link'
import Doctor from '@/components/doctor'
import { useForm } from 'react-hook-form';
import * as yup from "yup";
import { yupResolver } from '@hookform/resolvers/yup';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, Suspense } from "react";
import BeatLoader from 'react-spinners/BeatLoader';
import { authClient } from '@/lib/auth-client';
import { toast, Toaster } from 'sonner';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [loading, setLoading] = useState(false);
  const [color] = useState("#ffffff");
  const [resetSuccess, setResetSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)

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
    
    // Redirect to login after a short delay
    setTimeout(() => {
      router.push('/')
    }, 2000)
  }

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-red-600 font-medium">Invalid reset link</p>
        <p className="text-sm text-gray-600 mt-2">Please request a new password reset.</p>
        <Link href="/reset" className="text-primary font-medium mt-4 inline-block">
          Request new reset link
        </Link>
      </div>
    )
  }

  return (
    <form className='flex flex-col mt-16 text-sm' onSubmit={handleSubmit(onSubmit)}>
      <p className='mb-8'>Please enter your new password:</p>
      {
        resetSuccess
        ?
          <div className="text-center">
            <p className="text-green-600 font-medium">Password reset successfully!</p>
            <p className="text-sm text-gray-600 mt-2">Redirecting to login...</p>
          </div>
        :
          <>
            <label className="flex flex-col mb-4">
              <span className='font-medium'>New Password</span>
              <input 
                placeholder='your new password' 
                className='placeholder:italic placeholder:text-sm bg-white shadow-md rounded-full py-2 px-4' 
                type='password' 
                {...register('password')}
              />
              <p className='px-4 pt-1 text-sm text-red-600'>{errors.password?.message}</p>
            </label>
            <label className="flex flex-col mb-4">
              <span className='font-medium'>Confirm Password</span>
              <input 
                placeholder='confirm your password' 
                className='placeholder:italic placeholder:text-sm bg-white shadow-md rounded-full py-2 px-4' 
                type='password' 
                {...register('confirmPassword')}
              />
              <p className='px-4 pt-1 text-sm text-red-600'>{errors.confirmPassword?.message}</p>
            </label>
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
                  "Reset Password"
              }
            </button>
          </>
      }
      <p className='text-sm mt-4 mx-auto text-slate-900'>You remember your password? <Link href='/' className="text-primary font-medium">Log in here!</Link></p>
      {errorMsg && <p className='text-sm mt-4 mx-auto font-medium text-red-500'>{errorMsg}</p>}
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="pt-12 pb-2 px-8 md:px-16">
      <div className='flex flex-col md:flex-row pt-4'>
        <div className="md:basis-1/2 w-full">
          <h2 className='text-3xl text-slate-900 font-bold'>Reset <span className='text-primary'>password</span></h2>
          <p className='text-slate-900 text-sm'>Don&apos;t have an account yet? <Link href="/signup" className='text-primary font-semibold'>Sign up</Link></p>
          <Suspense fallback={<div className="mt-16">Loading...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
        <div className="basis-1/2">
          <Doctor />
        </div>
      </div>
      <Toaster position="top-center" richColors={true} />
    </div>
  )
}
