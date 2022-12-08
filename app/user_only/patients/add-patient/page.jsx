'use client'
import Link from 'next/link'
import { useForm } from 'react-hook-form';
import * as yup from "yup";
import { yupResolver } from '@hookform/resolvers/yup';
import PulseLoader from "react-spinners/PulseLoader"

const AddPatient = () => {
  const schema = yup.object({
    firstname: yup.string().required("Please enter patient's first name"),
    lastname: yup.string().required("Please enter patient's last name"),
    email: yup.string().email('Invalid email').required("Please enter patient's email"),
    age: yup.number().required("Please enter patient's age"),

  }).required();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema)
  });

  const onSubmit = values => addPatient(values)
  const addPatient = async values => {
    const {firstname, lastname, email, age} = values

  }


  return (
    <div className='pl-4'>
      <div className="flex flex-col w-full items-center">
        <p className=' text-2xl text-green-500 font-bold'>Add Patient</p>
        <form className="flex flex-col mt-8 w-1/2" onSubmit={handleSubmit(onSubmit)}>
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
            <span className="font-medium">Age</span>
            <input
              placeholder="age of the patient"
              className="placeholder:italic bg-white shadow-md rounded-full py-2 px-4"
              type="password"
              {...register('age')}
            />
            <p className='px-4 pt-1 text-sm text-red-600'>{errors.age?.message}</p>
          </label>

          <button className="py-2 px-4 rounded-full bg-green-500 text-lg font-semibold w-1/2 center mt-4 mx-auto" type='submit'>
            Add Patient
          </button>
        </form>
      </div>
    </div>
  )
}

export default AddPatient