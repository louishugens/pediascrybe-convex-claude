'use client'
import Link from 'next/link'
import { useForm } from 'react-hook-form';
import * as yup from "yup";
import { yupResolver } from '@hookform/resolvers/yup';
import PulseLoader from "react-spinners/PulseLoader"
import { useRouter } from 'next/navigation';
import useDoctor from '../../../../../utils/hooks/useDoctor';
import { useState } from "react";
import BeatLoader  from 'react-spinners/BeatLoader';

const AddPatient = () => {
  const schema = yup.object({
    firstname: yup.string().required("Please enter patient's first name"),
    lastname:  yup.string().required("Please enter patient's last name"),
    email: yup.string().email('Invalid email').required("Please enter patient's email"),
    birthdate: yup.date().required("Please enter patient's birth date"),
    mothername: yup.string(),
    sex: yup.string(),
    religion: yup.string(),
    phone: yup.string()
  }).required();
  
  let [color, setColor] = useState("#ffffff")
  let [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema)
  });

  const doctor = useDoctor()
  const router = useRouter()


  const onSubmit = async (values) => {
    setLoading(true)
 
    try{
      const {firstname, lastname, email, birthdate, mothername, sex, religion, phone} = values
      const body = {firstname, lastname, email, birthdate, mothername, sex, religion, phone, id: doctor.id}
      await fetch('/api/patients/addPatient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      router.refresh()
      router.push(`/user_only/patients`)

    }
    catch(err){
      console.log(err)
    }
    router.push(`/user_only/${doctor.id}/patients`)
  }
  // const create = async values =>{
  //   try{
  //     const {name, price, costs} = values
  //     const body = {name, price, companyId, costs}
  //     await fetch('/api/create/article', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify(body)
  //     })
  //     router.push(`/app/${companyId}/articles`)
  //   }
  //   catch(err){
  //     console.log(err)
  //   }
  // }


  return (
    <div className=''>
      <div className="flex flex-col w-full items-center">
        <p className=' text-2xl text-green-500 font-bold'>Add Patient</p>
        <form className="flex flex-col mt-8 w-2/3" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-x-8 gap-y-4 grid-cols-2 mt-4">
            <label className="flex flex-col mb-4 h-16">
              <span className="font-medium">First name</span>
              <input
                placeholder="John"
                className="placeholder:italic placeholder:text-sm bg-white shadow-md rounded-full py-2 px-4 border-none"
                type="text"
                {...register('firstname')}
              />
              <p className='px-4 pt-1 text-sm text-red-600'>{errors.firstname?.message}</p>
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
              <span className="font-medium">Mother&apos;s name</span>
              <input
                placeholder="Jane Doe"
                className="placeholder:italic placeholder:text-sm bg-white shadow-md rounded-full py-2 px-4 border-none"
                type="text"
                {...register('mothername')}
              />
              <p className='px-4 pt-1 text-sm text-red-600'>{errors.mothername?.message}</p>
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
              <span className="font-medium">Sex</span>
              <select
                // placeholder="Doe"
                // className="placeholder:italic bg-white shadow-md rounded-full py-2 px-4"
                // type="text"
                {...register('sex')}
              >
                <option value="female">female</option>
                <option value="male">male</option>
              </select>
              <p className='px-4 pt-1 text-sm text-red-600'>{errors.sex?.message}</p>
            </label>
            <label className="flex flex-col mb-4 h-16">
              <span className="font-medium">Religion</span>
              <input
                placeholder="Catholic"
                className="placeholder:italic placeholder:text-sm bg-white shadow-md rounded-full py-2 px-4 border-none"
                type="text"
                {...register('religion')}
              />
              <p className='px-4 pt-1 text-sm text-red-600'>{errors.religion?.message}</p>
            </label>
            <label className="flex flex-col mb-6 h-16">
              <span className="font-medium">Birth Date</span>
              <input
                placeholder="Birth date of the patient"
                className="placeholder:italic placeholder:text-sm bg-white shadow-md rounded-full py-2 px-4 border-none"
                type="date"
                {...register('birthdate')}
              />
              <p className='px-4 pt-1 text-sm text-red-600'>{errors.birthdate?.message}</p>
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
                  "Add Patient"
            }
          </button>
        </form>
      </div>
    </div>
  )
}

export default AddPatient