'use client'
import  {useState, CSSProperties} from 'react';
import Doctor from '@/components/doctor';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import * as yup from "yup";
import { yupResolver } from '@hookform/resolvers/yup';
import PulseLoader from "react-spinners/PulseLoader"
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import posthog from 'posthog-js';




export default function Signup() {
  const supabase = createClient()
  const override= {
    display: "block",
    margin: "auto",
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
  };

  

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [color, setColor] = useState('#22C55E')

  const schema = yup.object({
    firstname: yup.string().required('Please enter your first name'),
    lastname: yup.string().required('Please enter your last name'),
    email: yup.string().email('Invalid email').required('Please enter your email'),
    password: yup.string().required('Please enter your password'),
    terms: yup.boolean().required('Please confirm you read and accpept the terms').oneOf([true], "The terms and conditions must be accepted.")
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

    const {firstname, lastname, email, password} = values
    const { data: user, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        emailRedirectTo: `${process.env.BASE_URL}/signin`
      }
    })
    

    if(user){



      const {error} = await supabase.from('Doctor')
      .insert(
        {id: user.user.id,  firstname, lastname, email }
      )
      if(error){
        setError(error)
        setLoading(false)
        console.log('error :>> ', error);
      }else{
        // setLoading(false)
        const res = await fetch('/api/send', {
          method: 'POST',
          body: JSON.stringify({ email, lastname }),
        })
        const  emailres  = await res.json()
        console.log('email :>> ', emailres);
        posthog.capture('Signup success')
        router.push('/signup/success')

      }

    }

    if(error){
      setError(error)
    }

    // setLoading(false)
  }

  return (
    <div className="pt-12 pb-2 px-4">
      <div className="flex flex-col md:flex-row pt-4">
        <div className="w-full md:basis-1/2 pl-4 md:mx-12 mx-6">
          <h2 className="text-3xl text-slate-900 font-bold">
            Sign <span className="text-primary">Up</span>
          </h2>
          <p className="text-slate-900 text-sm">
            Already have an account?{' '}
            <Link href="/signin" className="text-primary font-semibold">
              Log in
            </Link>
          </p>
          <p className='text-slate-900 text-sm font-bold mt-16 md:hidden'>🌟 Unlock a Richer Experience: Connect from Your Laptop! 🌟</p>
          <p className='text-slate-900 text-sm mt-4 md:hidden'>👋 Hello there! We&apos;re thrilled to invite you to a whole new level of engagement and convenience. 🚀 While our mobile app offers the portability you love, we&apos;re excited to share that a world of enhanced features and capabilities awaits you when you connect using your laptop!</p>
          <p className='text-slate-900 text-sm mt-4 md:hidden'>See you on the larger side of life! 🎉</p>
          {
            loading
            ?
              <div className="h-1/2 w-full relative">
                <PulseLoader
                  color={color}
                  loading={loading}
                  cssOverride={override}
                  size={20}
                  aria-label="Loading Spinner"
                  data-testid="loader"
                />
              </div>
            :
            <form className="md:flex flex-col mt-3 text-sm hidden" onSubmit={handleSubmit(onSubmit)}>
              <label className="flex flex-col mb-4 h-16">
                <span className="font-medium">First name</span>
                <input
                  placeholder="John"
                  className="placeholder:italic placeholder:text-sm bg-white shadow-md rounded-full py-2 px-4"
                  type="text"
                  {...register('firstname')}
                />
                {errors?.firstname && <p className='px-4 pt-1 text-sm text-red-600'>{errors?.firstname?.message}</p>}
              </label>
              <label className="flex flex-col mb-4 h-16">
                <span className="font-medium">Last name</span>
                <input
                  placeholder="Doe"
                  className="placeholder:italic placeholder:text-sm bg-white shadow-md rounded-full py-2 px-4"
                  type="text"
                  {...register('lastname')}
                />
                {errors?.lastname && <p className='px-4 pt-1 text-sm text-red-600'>{errors?.lastname?.message}</p>}
              </label>
              <label className="flex flex-col mb-4 h-16">
                <span className="font-medium">Email</span>
                <input
                  placeholder="johndoe@example.com"
                  className="placeholder:italic placeholder:text-sm bg-white shadow-md rounded-full py-2 px-4"
                  type="email"
                  {...register('email')}
                />
                {errors.email && <p className='px-4 pt-1 text-sm text-red-600'>{errors?.email?.message}</p>}
              </label>
              <label className="flex flex-col mb-6 h-16">
                <span className="font-medium">Password</span>
                <input
                  placeholder="your password"
                  className="placeholder:italic placeholder:text-sm bg-white shadow-md rounded-full py-2 px-4"
                  type="password"
                  {...register('password')}
                />
                {errors?.email && <p className='px-4 pt-1 text-sm text-red-600'>{errors?.password?.message}</p>}
              </label>
              <div className="flex items-center mb-4">
                <label className="inline-flex relative items-center cursor-pointer">
                  <input
                    type="checkbox"
                    value=""
                    id="default-toggle"
                    className="sr-only peer"
                    {...register('terms')}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-gray-600"></div>
                  <p className="ml-3 text-base">
                    I agree to the
                  </p>
                </label>
                <Link href="/terms" className="ml-1 text-base text-primary font-semibold">
                  Terms and Conditions  
                </Link>
              </div>
              {errors?.terms && <p className='px-4 pt-1 text-xs text-red-600 mb-5'>{errors.terms?.message}</p>}

              <button className="py-2 px-4 rounded-full bg-primary text-muted text-lg font-semibold w-1/2 center mt-4 mx-auto" type='submit'>
                Create Account
              </button>
            </form>
          }
        </div>
        <div className="w-full md:basis-1/2">
          <Doctor className="mx-auto" />
        </div>
      </div>
    </div>
  );
}
