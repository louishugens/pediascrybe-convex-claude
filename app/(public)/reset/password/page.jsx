'use client'
import Link from 'next/link'
import Doctor from '@/components/doctor'
import { useForm } from 'react-hook-form';
import * as yup from "yup";
import { yupResolver } from '@hookform/resolvers/yup';
import { useRouter } from 'next/navigation';
import supabase from '@/utils/supabase';
import { useState, useEffect } from "react";
import BeatLoader  from 'react-spinners/BeatLoader';


export default function Home({searchParams}) {

  let [loading, setLoading] = useState(false);
  let [color, setColor] = useState("#ffffff");
  const [reset, setReset] = useState(searchParams ? true : false)
  const [errorMsg, setErrorMsg] = useState(null)

  console.log('token :>> ', searchParams);

  const router = useRouter()

  const schema = yup.object({
    // email: yup.string().email('Invalid email').required('Please enter your email'),
    password: yup.string().required('Please enter your password'),
  }).required();

  // useEffect(() => {
  //   supabase.auth.onAuthStateChange(async (event, session) => {
  //     if (event == "PASSWORD_RECOVERY") {
  //       // setReset(true)
        
  //       // const newPassword = prompt("What would you like your new password to be?");
  //       // console.log('newPassword :>> ', newPassword);
  //       // const { data, error } = await supabase.auth
  //       //   .updateUser({ password: newPassword })
 
  //       // if (data) alert("Password updated successfully!")
  //       // console.log('data :>> ', data);
  //       // if (error) alert("There was an error updating your password.")
  //       // console.log('error :>> ', error);
  //     }
  //   })
  // }, [])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema)
  });
  const onSubmit = data => handleReset(data);
  const base_url = process.env.NEXT_PUBLIC_BASEURL

  console.log('base_url :>> ', base_url);

  const handleReset = async values =>{
    setLoading(true)
    const { data, error } = await supabase.auth
          .updateUser({ password: values.password })
  
    if(data){
      setReset(false)
      setLoading(false)
    }

    if(error) {
      setErrorMsg(error.message)
      setLoading(false)
    }
  }

  // const authenticateUser = async values => {
  //   setLoading(true)
  //   const { data:{user}, error } = await supabase.auth.signInWithPassword({
  //     email: values.email,
  //     password: values.password,
  //   })
  //   user && router.push(`/user_only/${user.id}/dashboard`)
  //   error && console.log('error', error)
  // }

  return (
    <div className="pt-12 pb-2 px-8 md:px-16">
      <div className='flex flex-col md:flex-row pt-4'>
        <div className="md:basis-1/2 w-full">
          <h2 className='text-3xl text-slate-900 font-bold'>Reset <span className='text-primary'>password</span></h2>
          <p className='text-slate-900 text-sm'>Don&apos;t have an account yet? <Link href="/signup" className='text-primary font-semibold'>Sign up</Link></p>
          <form className='flex flex-col mt-16 text-sm' onSubmit={handleSubmit(onSubmit)}>
            <p className='mb-8'>Please enter your new password:</p>
            {
              reset
              ?
                <label className="flex flex-col mb-4">
                  <span className='font-medium'>Password</span>
                  <input placeholder='your password' className='placeholder:italic placeholder:text-sm bg-white shadow-md rounded-full py-2 px-4' type='password' {...register('password')}/>
                  <p className='px-4 pt-1 text-sm text-red-600'>{errors.password?.message}</p>
                </label>
              :
                <p>Password reset successfully</p>
              
            }
            {/* <label className="flex flex-col mb-4">
              <span className='font-medium'>Password</span>
              <input placeholder='your password' className='placeholder:italic placeholder:text-sm bg-white shadow-md rounded-full py-2 px-4' type='password' {...register('password')}/>
              <p className='px-4 pt-1 text-sm text-red-600'>{errors.password?.message}</p>
            </label> */}
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
                  "Submit"}
            </button>
            <p className='text-sm mt-4 mx-auto text-slate-900'>You remember your password? <Link href={'#'} className="text-primary font-medium" >Log in here!</Link></p>
            {errorMsg && <p className='text-sm mt-4 mx-auto font-medium text-red-500'>{errorMsg}</p>}
          </form>
          
        </div>
        <div className="basis-1/2">
          <Doctor />
        </div>
      </div>
    </div>
  )
}
