'use client'
import { FieldError, useForm } from 'react-hook-form';
import * as yup from "yup";
import { yupResolver } from '@hookform/resolvers/yup';
import PulseLoader from "react-spinners/PulseLoader"
import { useRouter } from 'next/navigation';
import { useState } from "react";
import BeatLoader  from 'react-spinners/BeatLoader';


const EditDoctor = ({doctor}) => {
  const schema = yup.object({
    firstname: yup.string().required("Please enter your first name"),
    lastname:  yup.string().required("Please enter your last name"),
    email: yup.string().email('Invalid email').required("Please enter your email"),
    phone: yup.string().required("Please enter your last name"),
    spec: yup.string().required("Please enter your specialty"),
    address:yup.string(),
  }).required();
  
  let [color, setColor] = useState("#ffffff")
  let [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues:{
      firstname: doctor.firstname || '',
      lastname: doctor.lastname || '',
      email: doctor.email || '',
      phone: doctor.phone || '',
      spec: doctor.spec || '',
      address: doctor.address || '',
    },
    resolver: yupResolver(schema)
  });

  const router = useRouter()


  const onSubmit = async (values) => {
    setLoading(true)
 
    try{
      const {firstname, lastname, email, phone, spec, address} = values
      const body = {firstname, lastname, email, phone, spec, address, id: doctor.id}
      await fetch('/api/doctor/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      router.refresh()
      router.push(`/user/profile`)

    }
    catch(err){
      console.log(err)
    }
    router.push(`/user/profile`)
  }

  return (
    <div className="flex flex-col w-full items-center">
      <p className=' text-2xl text-green-500 font-bold'>Edit Profile</p>
      <form className="flex flex-col mt-8 w-2/3 text-sm" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-x-8 gap-y-4 grid-cols-2 mt-4">
          <label className="flex flex-col mb-4 h-16">
            <span className="font-medium">First name</span>
            <input
              placeholder="John"
              className="placeholder:italic placeholder:text-sm bg-white shadow-md rounded-full py-2 px-4 border-none"
              type="text"
              {...register('firstname')}
            />
            <p className='px-4 pt-1 text-sm text-red-600'>{errors?.firstname?.message}</p>
          </label>
          <label className="flex flex-col mb-4 h-16">
            <span className="font-medium">Last name</span>
            <input
              placeholder="Doe"
              className="placeholder:italic placeholder:text-sm bg-white shadow-md rounded-full py-2 px-4 border-none"
              type="text"
              {...register('lastname')}
            />
            <p className='px-4 pt-1 text-sm text-red-600'>{errors.lastname?.message}</p>
          </label>
          <label className="flex flex-col mb-4 h-16">
            <span className="font-medium">Phone</span>
            <input
              placeholder="+50937000000"
              className="placeholder:italic placeholder:text-sm bg-white shadow-md rounded-full py-2 px-4 border-none"
              type="tel"
              {...register('phone')}
            />
            <p className='px-4 pt-1 text-sm text-red-600'>{errors.phone?.message}</p>
          </label>
          <label className="flex flex-col mb-4 h-16">
            <span className="font-medium">Email</span>
            <input
              placeholder="johndoe@example.com"
              className="placeholder:italic placeholder:text-sm bg-white shadow-md rounded-full py-2 px-4 border-none"
              type="email"
              {...register('email')}
            />
            <p className='px-4 pt-1 text-sm text-red-600'>{errors.email?.message}</p>
          </label>
          <label className="flex flex-col mb-4 h-16">
            <span className="font-medium">Specialty</span>
            <input
              placeholder="Pediatrician"
              className="placeholder:italic placeholder:text-sm bg-white shadow-md rounded-full py-2 px-4 border-none"
              type="text"
              {...register('spec')}
            />
            <p className='px-4 pt-1 text-sm text-red-600'>{errors.spec?.message}</p>
          </label>
          <label className="flex flex-col mb-4 h-16">
            <span className="font-medium">Address</span>
            <input
              placeholder="13, rue des beaux arts, Paris"
              className="placeholder:italic placeholder:text-sm bg-white shadow-md rounded-full py-2 px-4 border-none"
              type="text"
              {...register('address')}
            />
            <p className='px-4 pt-1 text-sm text-red-600'>{errors.address?.message}</p>
          </label>
        </div>

        <button className="py-2 px-4 rounded-full bg-green-500 text-lg font-semibold w-1/2 center mt-4 mx-auto" type='submit'>
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
      </form>
    </div>
  )
}

export default EditDoctor