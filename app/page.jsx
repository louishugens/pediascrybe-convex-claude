'use client'
import Link from 'next/link'
import Doctor from '../components/doctor'
import { useForm } from 'react-hook-form';
import * as yup from "yup";
import { yupResolver } from '@hookform/resolvers/yup';
import { useRouter } from 'next/navigation';
import supabase from '../utils/supabase';
import Header from './header';
import { useState } from "react";
import BeatLoader  from 'react-spinners/BeatLoader';



export default function Home() {

  let [loading, setLoading] = useState(false);
  let [color, setColor] = useState("#ffffff");

  const router = useRouter()

  const schema = yup.object({
    email: yup.string().email('Invalid email').required('Please enter your email'),
    password: yup.string().required('Please enter your password'),
  }).required();


  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema)
  });
  const onSubmit = data => authenticateUser(data);

  const authenticateUser = async values => {
    setLoading(true)
    const { data:{user}, error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    })
    user && router.push(`/user_only/${user.id}/dashboard`)
    error && console.log('error', error)
  }

  return (
    <div className="py-2 px-4">
      <Header />
      <div className='flex flex-row pt-4'>
        <div className="basis-1/2 pl-4 mx-12">
          <h2 className='text-3xl text-slate-900 font-bold'>Log <span className='text-green-500'>In</span></h2>
          <p className='text-slate-900 text-sm'>Don&apos;t have an account yet? <Link href="/signup" className='text-green-500 font-semibold'>Sign up</Link></p>
          <form className='flex flex-col mt-16 text-sm' onSubmit={handleSubmit(onSubmit)}>
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
            <button className='py-2 px-4 rounded-full bg-green-500 text-lg font-semibold w-1/2 center mt-4 mx-auto' type='submit'>
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
          </form>
        </div>
        <div className="basis-1/2">
          <Doctor />
        </div>
      </div>
    </div>
  )
}
