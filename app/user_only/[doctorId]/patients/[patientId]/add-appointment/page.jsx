'use client'
import Link from 'next/link'
import { useForm } from 'react-hook-form';
import * as yup from "yup";
import { yupResolver } from '@hookform/resolvers/yup';
import PulseLoader from "react-spinners/PulseLoader"
import { useRouter } from 'next/navigation';
import { useState } from "react";
import BeatLoader  from 'react-spinners/BeatLoader';
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
// import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
import { ListItemNode, ListNode } from "@lexical/list";
import OnChangePlugin from '@lexical/react/LexicalOnChangePlugin'
import ToolbarPlugin from "../../../../../../components/listToolBar";
import PlaygroundTheme from "../../../../../../components/playgroundTheme";
import prepopulatedText from "../../../../../../components/sampleText";


export const dynamic = 'force-dynamic';


const AddAppointment = ({params: {doctorId, patientId}}) => {
  const schema = yup.object({
    height: yup.number('Must be a number').nullable(true).transform((_, val) => val ? Number(val) : null),
    weight:  yup.number().nullable(true).transform((_, val) => val ? Number(val) : null),
    head: yup.number().nullable(true).transform((_, val) => val ? Number(val) : null),
    motif: yup.string().nullable(true),
    findings: yup.string().nullable(true),
    arm: yup.number().nullable(true).transform((_, val) => val ? Number(val) : null),
    sao2: yup.number().nullable(true).transform((_, val) => val ? Number(val) : null).max(100, "Percentage can't be more than 100"),
  }).required();
  
  let [color, setColor] = useState("#ffffff")
  let [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues:{
      height: null,
      weight: null,
      head: null,
      motif: null,
      findings: null,
      arm: null,
      sao2: null,
    },
    resolver: yupResolver(schema)
  });

  // const doctor = useDoctor()
  const router = useRouter()


  const onSubmit = async (values) => {
    setLoading(true)
 
    try{
      const {height, weight, head, motif, findings, arm, sao2} = values
      const body = {height, weight, head, motif, findings, arm, sao2, patientId, doctorId}
      const response = await fetch('/api/patients/addAppointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const appointment = await response.json()

      router.refresh()
      router.push(`/user_only/${doctorId}/patients/${patientId}/${appointment.id}`)

    }
    catch(err){
      console.log(err)
    }
    // router.push(`/user_only/${doctorId}/patients/${patientId}/${appointment.id}`)
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
          </div>
          <div className="grid gap-x-8 gap-y-4 grid-cols-2">
            <label className="flex flex-col mb-4 h-40">
              <span className="font-medium">Symptoms</span>
              <textarea
                placeholder="How do the patient feel?"
                className="placeholder:italic placeholder:text-sm bg-white shadow-md h-40 rounded-md py-2 px-4 border-none"
                type="text"
                {...register('motif')}
              />
              <p className='px-4 pt-1 text-sm text-red-600'>{errors.motif?.message}</p>
            </label>
            <label className="flex flex-col mb-4 h-40">
              <span className="font-medium">Diagnotic</span>
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


