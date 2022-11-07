'use client'
import Doctor from '../doctor';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import * as yup from "yup";
import { yupResolver } from '@hookform/resolvers/yup';

export default function Signup() {

  const schema = yup.object({
    firstname: yup.string().required('Please enter your first name'),
    lastname: yup.string().required('Please enter your last name'),
    email: yup.string().email('Invalid email').required('Please enter your first name'),
    password: yup.string().required('Please enter your password'),
    terms: yup.boolean().required('Please confirm you reada and accpept the terms').oneOf([true], "The terms and conditions must be accepted.")
  }).required();


  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema)
  });
  const onSubmit = (data) => console.log(data);

  return (
    <div className="flex flex-row pt-4">
      <div className="basis-1/2 pl-4 mx-12">
        <h2 className="text-3xl text-slate-900 font-bold">
          Sign <span className="text-green-500">Up</span>
        </h2>
        <p className="text-slate-900 text-base">
          Already have an account?{' '}
          <Link href="/" className="text-green-500 font-semibold">
            Log in
          </Link>
        </p>
        <form className="flex flex-col mt-3" onSubmit={handleSubmit(onSubmit)}>
          <label className="flex flex-col mb-4 h-16">
            <span className="font-medium">First name</span>
            <input
              placeholder="John"
              className="placeholder:italic bg-white shadow-md rounded-full py-2 px-4"
              type="text"
              {...register('firstname')}
            />
            <p className='px-4 pt-1 text-sm text-red-600'>{errors.firstname?.message}</p>
          </label>
          <label className="flex flex-col mb-4 h-16">
            <span className="font-medium">Last name</span>
            <input
              placeholder="Doe"
              className="placeholder:italic bg-white shadow-md rounded-full py-2 px-4"
              type="text"
              {...register('lastname')}
            />
            <p className='px-4 pt-1 text-sm text-red-600'>{errors.lastname?.message}</p>
          </label>
          <label className="flex flex-col mb-4 h-16">
            <span className="font-medium">Email</span>
            <input
              placeholder="johndoe@example.com"
              className="placeholder:italic bg-white shadow-md rounded-full py-2 px-4"
              type="email"
              {...register('email')}
            />
            <p className='px-4 pt-1 text-sm text-red-600'>{errors.email?.message}</p>
          </label>
          <label className="flex flex-col mb-6 h-16">
            <span className="font-medium">Password</span>
            <input
              placeholder="your password"
              className="placeholder:italic bg-white shadow-md rounded-full py-2 px-4"
              type="password"
              {...register('password')}
            />
            <p className='px-4 pt-1 text-sm text-red-600'>{errors.password?.message}</p>
          </label>
          <label className="inline-flex relative items-center cursor-pointer mb-4">
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
              <span className="font-medium text-green-500">
                Terms of Service
              </span>
            </p>
            <p className='px-4 pt-1 text-sm text-red-600'>{errors.terms?.message}</p>
          </label>

          <button className="py-2 px-4 rounded-full bg-green-500 text-lg font-semibold w-1/2 center mt-4 mx-auto" type='submit'>
            Create Account
          </button>
        </form>
      </div>
      <div className="basis-1/2">
        <Doctor className="mx-auto" />
      </div>
    </div>
  );
}
