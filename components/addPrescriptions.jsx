'use client'
import { useState } from 'react'
import { useForm, Control, useFieldArray, useWatch  } from 'react-hook-form';
import * as Yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup';
import { useRouter } from 'next/navigation'
import { BeatLoader } from 'react-spinners';
import { XCircleIcon } from '@heroicons/react/24/outline';

const PrescriptionsSchema =  Yup.object({
  prescriptions: Yup.array().of(
    Yup.object().shape({
      drug: Yup.string().required('Please enter the drug name'),
      count: Yup.number().required('Please enter the number of flacon').min(1),
      posology: Yup.string().required('Please enter the posology'),
  })).required('Please add at least one prescription').min(1, 'Please add at least one prescription')
}).required();

const AddPrescriptions = ({doctorId, patientId, appointment}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [color, setColor] = useState('#ffffff')
  const router = useRouter()
  const [prescriptions, setPrescriptions] = useState(appointment.medication || [{drug: null, count: 1, posology: null}])

  // console.log('user :>> ', user);
  // console.log('day :>> ', day);
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    control,
  } = useForm({
    resolver: yupResolver(PrescriptionsSchema),
    defaultValues: {
      prescriptions: prescriptions,
    },
  });

  const { fields, append, prepend, remove } = useFieldArray({
    name: "prescriptions",
    control,
    rules: {
      required: "Please append at least 1 prescription"
    }
  });

  const onSubmit = async values => {
    setLoading(true)
 
    try{
      const {prescriptions } = values

      const body = {medication: prescriptions, appointmentId: appointment.id}
      const myuser = await fetch('/api/patients/addPrescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const newuser = await myuser.json()

      console.log('user :>> ', newuser);

      router.refresh()
      router.push(`/user_only/${doctorId}/patients/${patientId}/${appointment.id}`)

    }
    catch(err){
      console.log(err)
    }
  }


  return (
    <div className="w-full h-auto shadow-md rounded-lg p-4 bg-slate-50 mt-4 text-sm">
      <p>Add prescriptions</p>
      <form className='mt-4' onSubmit={handleSubmit(onSubmit)}>
      {fields.map((field, index) => {
        return (
          <section key={field.id} className="relative pt-8">
            <XCircleIcon className='h-6 w-6 text-red-500 absolute right-0 top-0 mt-4 mr-4 cursor-pointer' onClick={() => remove(index)}/>
            <div className='grid grid-cols-12 gap-4'>
              <div className="col-span-5">
                <label className="flex flex-col mb-4 h-16">
                  <span className='font-medium text-sm'>Drug {index + 1}</span>
                  <input placeholder='Paracetamol' className='placeholder:italic placeholder:text-sm bg-white shadow-md rounded-full text-sm py-1 px-4' type='text' {...register(`prescriptions.${index}.drug`)}/>
                  <p className='px-4 pt-1 text-sm text-red-600'>{errors?.prescriptions?.[index]?.drug?.message}</p>
                </label>
              </div>
              <div className="col-span-2">
                <label className="flex flex-col mb-4 h-16">
                  <span className='font-medium text-sm'>Count</span>
                  <input placeholder='1' className='placeholder:italic placeholder:text-sm bg-white shadow-md rounded-full text-sm py-1 px-4' type='text' {...register(`prescriptions.${index}.count`)}/>
                  <p className='px-4 pt-1 text-sm text-red-600'>{errors?.prescriptions?.[index]?.count?.message}</p>
                </label>
              </div>
              <div className="col-span-5">
                <label className="flex flex-col mb-4 h-16">
                  <span className='font-medium text-sm'>Posology</span>
                  <input placeholder='1 pill twice a day for 7 days' className='placeholder:italic placeholder:text-sm bg-white shadow-md rounded-full text-sm py-1 px-4' type='text' {...register(`prescriptions.${index}.posology`)}/>
                  <p className='px-4 pt-1 text-sm text-red-600'>{errors?.prescriptions?.[index]?.posology?.message}</p>
                </label>
              </div>
            </div>
          </section>
          )
        })}
        <p className='px-4 pt-1 text-sm text-red-600'>{errors?.prescriptions?.message}</p>
        <div className="flex flex-row justify-between">
          <button className='py-1 px-4 rounded-full bg-green-500 text-white text-sm  mt-4' type='button' onClick={() => append({drug: null, count: 1, posology: null})}>
            Add
          </button>
          {<button className='py-1 px-4 rounded-full bg-blue-500 text-white text-sm  mt-4' type='submit'>
            {
              loading
              ?
              <BeatLoader
                color={color}
                size={5}
                aria-label="Loading Spinner"
                data-testid="loader"
              />
              :
                "Send"}
          </button>}
        </div>
      </form>
      
    </div>
  )
}

export default AddPrescriptions