'use client'
import Link from 'next/link'
import { useForm } from 'react-hook-form';
import * as yup from "yup";
import { yupResolver } from '@hookform/resolvers/yup';
import { useRouter } from 'next/navigation';
import { useState } from "react";
import BeatLoader  from 'react-spinners/BeatLoader';
import { format } from 'date-fns';

const EditPatient = ({patient, doctorId}) => {
  const schema = yup.object({
    firstname: yup.string().required("Please enter patient's first name"),
    lastname:  yup.string().required("Please enter patient's last name"),
    email: yup.string().email('Invalid email'),
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
    defaultValues:{
      firstname: patient.firstname || null,
      lastname: patient.lastname || null,
      email: patient.email || null,
      phone: patient.phone || null,
      // birthdate: format(new Date(patient.birthdate), 'MM-dd-yyyy') || null,
      birthdate: new Date(patient.birthdate).toISOString().substr(0, 10) || null,
      mothername: patient.mothername || null,
      sex: patient.sex || null,
      religion: patient.religion || null,
    },
    resolver: yupResolver(schema)
  });

  console.log(patient)

  const router = useRouter()


  const onSubmit = async (values) => {
    setLoading(true)
 
    try{
      const {firstname, lastname, email, birthdate, mothername, sex, religion, phone} = values
      const body = {firstname, lastname, email, birthdate, mothername, sex, religion, phone, id: patient.id}
      await fetch('/api/patients/updatePatient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      router.refresh()
      router.push(`/user_only/${doctorId}/patients/${patient.id}`)

    }
    catch(err){
      console.log(err)
    }
    router.push(`/user_only/${doctorId}/patients/${patient.id}`)
  }



  return (
    <div className='pt-4'>
      <div className="flex flex-col w-full items-center">
        <p className=' text-2xl text-green-500 font-bold'>Edit Patient</p>
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
                  "Edit Patient"
            }
          </button>
        </form>
      </div>
    </div>
  )
}

export default EditPatient