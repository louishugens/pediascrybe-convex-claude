'use client'
import Link from 'next/link'
import { useForm } from 'react-hook-form';
import * as yup from "yup";
import { yupResolver } from '@hookform/resolvers/yup';
import PulseLoader from "react-spinners/PulseLoader"
import { useRouter } from 'next/navigation';
import { useState, useEffect } from "react";
import BeatLoader  from 'react-spinners/BeatLoader';
import { formatDistanceToNow } from "date-fns"
import { useDebouncedCallback } from 'use-debounce'
import { generateDiagnosticPrompt } from '@/lib/prompts'



const AddAppointment = ({doctorId, patientId, patient}) => {
  const schema = yup.object({
    height: yup.number('Must be a number').nullable(true).transform((_, val) => val ? Number(val) : null),
    weight:  yup.number().nullable(true).transform((_, val) => val ? Number(val) : null),
    head: yup.number().nullable(true).transform((_, val) => val ? Number(val) : null),
    motif: yup.string().nullable(true),
    findings: yup.string().nullable(true),
    arm: yup.number().nullable(true).transform((_, val) => val ? Number(val) : null),
    sao2: yup.number().nullable(true).transform((_, val) => val ? Number(val) : null).max(100, "Percentage can't be more than 100"),
    temperature: yup.number().nullable(true).transform((_, val) => val ? Number(val) : null),
  }).required();
  
  let [color, setColor] = useState("#ffffff")
  let [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState('');
  let [thinking, setThinking] = useState(false)




  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm({
    defaultValues:{
      height: null,
      weight: null,
      head: null,
      motif: null,
      findings: suggestions || null,
      arm: null,
      sao2: null,
      temperature: null,
    },
    resolver: yupResolver(schema)
  });

  const symptoms = watch('motif')

  useEffect(() => {
    const fetchDiagnosticSuggestions = async () => {
      if (symptoms) {
        setThinking(true)
        const messages = generateDiagnosticPrompt(symptoms, patient.birthdate)
        try {
          const response = await fetch('/api/diagnostic', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({messages})
          });
          const data = await response.json();
          console.log('data :>> ', data);
          setSuggestions(data); 
          setValue('findings', data); 
          setThinking(false)
        } catch (error) {
          console.error("Error fetching suggestions:", error);
        }
      }
    };

    const timeoutId = setTimeout(() => {
      if (symptoms){
        fetchDiagnosticSuggestions();
      }
    }, 1500)

    return () => clearTimeout(timeoutId);

  }, [symptoms, patient.birthdate, setValue]);

  // const doctor = useDoctor()
  const router = useRouter()


  const onSubmit = async (values) => {
    setLoading(true)
 
    try{
      const {height, weight, head, motif, findings, arm, sao2, temperature} = values
      const body = {height, weight, head, motif, findings, arm, sao2, temperature, patientId, doctorId}
      const response = await fetch('/api/patients/addAppointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const appointment = await response.json()

      router.refresh()
      router.push(`/user/patients/${patientId}/${appointment.id}`)

    }
    catch(err){
      console.log(err)
    }
    // router.push(`/user_only/${doctorId}/patients/${patientId}/${appointment.id}`)
  }



  return (
    <div className='pt-4'>
      <div className="flex flex-col w-full">
        <p className='text-1xl text-green-500 font-bold'>
          New Appointment
        </p>
        <form className="flex flex-col mt-4 w-full text-sm" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-x-8 gap-y-4 grid-cols-3">
            <label className="flex flex-col mb-4 h-16">
              <span className="font-medium">Height (in cm)</span>
              <input
                placeholder="Patient's height in cm"
                className="placeholder:italic placeholder:text-sm bg-white shadow-md rounded-full py-2 px-4 border-none"
                type="number"
                step={0.001}
                {...register('height')}
              />
              <p className='px-4 pt-1 text-sm text-red-600'>{errors.height?.message}</p>
            </label>
            <label className="flex flex-col mb-4 h-16">
              <span className="font-medium">Weight (in kg)</span>
              <input
                placeholder="Patient's weight in kg"
                className="placeholder:italic placeholder:text-sm bg-white shadow-md rounded-full py-2 px-4 border-none"
                type="number"
                step={0.001}
                {...register('weight')}
              />
              <p className='px-4 pt-1 text-sm text-red-600'>{errors.weight?.message}</p>
            </label>
            <label className="flex flex-col mb-4 h-16">
              <span className="font-medium">Head circumference (in cm)</span>
              <input
                placeholder="Patient's head circumference in cm"
                className="placeholder:italic placeholder:text-sm bg-white shadow-md rounded-full py-2 px-4 border-none"
                type="number"
                step={0.001}
                {...register('head')}
              />
              <p className='px-4 pt-1 text-sm text-red-600'>{errors.head?.message}</p>
            </label>
            <label className="flex flex-col mb-4 h-16">
              <span className="font-medium">Arm circumference (in cm)</span>
              <input
                placeholder="Patient's arm circumference in cm"
                className="placeholder:italic placeholder:text-sm bg-white shadow-md rounded-full py-2 px-4 border-none"
                type="number"
                step={0.001}
                {...register('arm')}
              />
              <p className='px-4 pt-1 text-sm text-red-600'>{errors.arm?.message}</p>
            </label>
            <label className="flex flex-col mb-4 h-16">
              <span className="font-medium">SaO2 (in %)</span>
              <input
                placeholder="Patient's SaO2 in percentage"
                className="placeholder:italic placeholder:text-sm bg-white shadow-md rounded-full py-2 px-4 border-none"
                type="number"
                step={0.001}
                {...register('sao2')}
              />
              <p className='px-4 pt-1 text-sm text-red-600'>{errors.sao2?.message}</p>
            </label>
            <label className="flex flex-col mb-4 h-16">
              <span className="font-medium">Temperature (in °C)</span>
              <input
                placeholder="Patient's temperature in °C"
                className="placeholder:italic placeholder:text-sm bg-white shadow-md rounded-full py-2 px-4 border-none"
                type="number"
                step={0.001}
                {...register('temperature')}
              />
              <p className='px-4 pt-1 text-sm text-red-600'>{errors.temperature?.message}</p>
            </label>
          </div>
          <div className="grid gap-x-8 gap-y-4 grid-cols-2">
            <label className="flex flex-col mb-4 h-40 gap-y-2">
              <span className="font-medium">Signs and Symptoms</span>
              <textarea
                placeholder="How do the patient feel?"
                className="placeholder:italic placeholder:text-sm bg-white shadow-md h-40 rounded-md py-2 px-4 border-none"
                type="text"
                {...register('motif')}
              />
              <p className='px-4 pt-1 text-sm text-red-600'>{errors.motif?.message}</p>
            </label>
            <label className="flex flex-col mb-4 h-40 gap-y-2">
              <span className="font-medium">
                Diagnostic
                {thinking && <span className=' font-light text-primary'> ScrybeGPT thinking <PulseLoader color={"#21C55D"} size={5} aria-label="Loading Spinner" data-testid="loader"/></span> }
              </span>
              <textarea
                placeholder="What do you beleive the patient is suffering from?"
                className="placeholder:italic placeholder:text-sm bg-white shadow-md h-40 rounded-md py-2 px-4 border-none"
                type="text"
                {...register('findings')}
              />
              <p className='px-4 pt-1 text-sm text-red-600'>{errors.findings?.message}</p>
            </label>
            {/* <label className="flex flex-col mb-4 h-40">
              <span className="font-medium">Prescription (Rx)</span>
              <textarea
                placeholder="Drug prescription"
                className="placeholder:italic placeholder:text-sm bg-white shadow-md h-40 rounded-md py-2 px-4 border-none"
                type="text"
                {...register('medication')}
              />
              <p className='px-4 pt-1 text-sm text-red-600'>{errors.medication?.message}</p>
            </label> */}
            {/* <label className="flex flex-col mb-4 h-40">
              <span className="font-medium">Lab exams</span>
              <textarea
                placeholder="Lab tests"
                className="placeholder:italic placeholder:text-sm bg-white shadow-md h-40 rounded-md py-2 px-4 border-none"
                type="text"
                {...register('exams')}
              />
              <p className='px-4 pt-1 text-sm text-red-600'>{errors.exams?.message}</p>
            </label> */}
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
                  "Add Appointment"
            }
          </button>
        </form>
      </div>
    </div>
  )
}

export default AddAppointment


