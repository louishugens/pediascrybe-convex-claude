'use client'
import { useState, useEffect } from 'react'
import { useForm, Control, useFieldArray, useWatch, FieldError  } from 'react-hook-form';
import * as Yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation'
import { BeatLoader } from 'react-spinners';
import { XCircleIcon } from '@heroicons/react/24/outline';
import { formatDistanceToNow } from "date-fns"
import PulseLoader from "react-spinners/PulseLoader"
import  * as z from "zod"
import { cn } from "@/lib/utils"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { refresh } from '@/app/actions';




export const formSchema = z.object({
  recommendation: z.string({ error: (issue) => issue.input === undefined ? 
    "Please enter your recommendations" :
    "Not a string" 
    }),
});


const AddRecommendation = ({patient, patientId, appointment}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [color, setColor] = useState('#ffffff')
  const router = useRouter()
  const [recommendation, setRecommendation] = useState(appointment.recommendation || '')
  const [thinking, setThinking] = useState(false)

  // useEffect(() => {
  //   const fetchPrescriptionsSuggestions = async () => {
  //     setThinking(true)

  //       const messages = [
  //         {role: "system", content: "Generate a list of drug prescriptions based on the patient's symptoms and diagnostics.\
  //         provide it in JSON array format as in the following example : [{drug: \"Paracetamol\", count: 1, posology: \"1 pill twice a day\"}, ... ] \
  //         send an empty array if no drugs are suggested. Only send the JSON and nothing else. Use same language as the one used in the symptoms and diagnostics."},
  //         {role: "user", content: `The patient is ${formatDistanceToNow(new Date(patient.birthdate))}`},
  //         // {role: "system", content: "mimic the pediatrician's language and resppond as if you where the pediatrician writing the diagnostic."},
  //         // {role: "system", content: "summarize your findings in a few sentences."},
  //         {role: "user", content: appointment.motif ? `The patient symptoms are ${appointment.motif}` : ''},
  //         {role: "user", content: appointment.finding ? `The pediatrician's diagnostic is ${appointment.finding}` : ''},
  //         // {role: "system", content: "Translate the list in the language the symptoms and diagnostics are provided."},
  //       ]

        
  //       try {
  //         const response = await fetch('/api/diagnostic', {
  //           method: 'POST',
  //           headers: {
  //             'Content-Type': 'application/json',
  //           },
  //           body: JSON.stringify({messages})
  //         });
  //         const data = await response.json();
  //         console.log('data :>> ', data);
  //         const myexams = JSON.parse(data)
  //         console.log('myexams :>> ', myexams);
  //         myexams.forEach(exam => {
  //           prepend(exam)
  //         }
  //         )
  //         setThinking(false)

  //       } catch (error) {
  //         console.error("Error fetching suggestions:", error);
  //       }
  //   };

  //       fetchPrescriptionsSuggestions();

  // }, [patient.birthdate]);

  type FormValues = z.infer<typeof formSchema>

  const form  = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
     recommendation: recommendation,
    },
  });

  // const { fields, append, prepend, remove } = useFieldArray({
  //   name: "prescriptions",
  //   control,
  //   rules: {
  //     required: "Please append at least 1 prescription"
  //   }
  // });

  const onSubmit = async values => {
    setLoading(true)
 
    try{
      const {recommendation } = values

      const body = {recommendation, appointmentId: appointment._id}
      const myuser = await fetch('/api/patients/addRecommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const newuser = await myuser.json()

  
      refresh([`/user/patients/${appointment.patientId}/${appointment._id}`, `/user/patients/${appointment.patientId}/${appointment._id}/add-recommendation`])

      
      router.push(`/user/patients/${patientId}/${appointment._id}`)

    }
    catch(err){
      console.log(err)
    }
  }

  // console.log('errors :>> ', errors?.prescriptions?.[4].count);


  return (
    <div className="w-full h-auto shadow-md rounded-lg p-4 bg-slate-50 mt-4 text-sm flex flex-col items-center">
      <p className='font-bold'>Add Recommendations</p>
      {/* <form className='mt-4' onSubmit={handleSubmit(onSubmit)}>
      {thinking && <span className=' font-light text-primary'> ScrybeGPT thinking <PulseLoader color={"#21C55D"} size={5} aria-label="Loading Spinner" data-testid="loader"/></span> }
      {fields.map((field, index) => {
        return (
          <section key={field.id} className="relative pt-8">
            <XCircleIcon className='h-6 w-6 text-red-500 absolute right-0 top-0 mt-4 mr-4 cursor-pointer' onClick={() => remove(index)}/>
            <div className='grid grid-cols-12 gap-4'>
              <div className="col-span-4">
                <label className="flex flex-col mb-4 h-16">
                  <span className='font-medium text-sm'>Drug {index + 1}</span>
                  <input placeholder='Paracetamol' className='placeholder:italic placeholder:text-sm bg-white shadow-md rounded-full text-sm py-1 px-4' type='text' {...register(`prescriptions.${index}.drug`)}/>
                  <p className='px-4 pt-1 text-sm text-red-600'>{errors?.prescriptions?.[index]?.drug?.message}</p>
                </label>
              </div>
              <div className="col-span-2">
                <label className="flex flex-col mb-4 h-16">
                  <span className='font-medium text-sm'>Count</span>
                  <input  
                    className='placeholder:italic placeholder:text-sm bg-white shadow-md rounded-full text-sm py-1 px-4' 
                    type='number' 
                    {...register(`prescriptions.${index}.count`, {
                      setValueAs: (value) => Number(value),
                    })}
                  />
                  <p className='px-4 pt-1 text-sm text-red-600'>{errors?.prescriptions?.[index]?.count?.message}</p>
                </label>
              </div>
              <div className="col-span-2">
                <label className="flex flex-col mb-4 h-16">
                  <span className='font-medium text-sm'>Unit</span>
                  <input placeholder='flacon, bottle, vial, etc...' className='placeholder:italic placeholder:text-sm bg-white shadow-md rounded-full text-sm py-1 px-4' type='text' {...register(`prescriptions.${index}.unit`)}/>
                  <p className='px-4 pt-1 text-sm text-red-600'>{errors?.prescriptions?.[index]?.unit?.message}</p>
                </label>
              </div>
              <div className="col-span-4">
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
        <p className='px-4 pt-1 text-sm text-red-600'>{errors?.prescriptions?.root?.message as React.ReactNode}</p>
        <div className="flex flex-row justify-between">
          <button className='py-1 px-4 rounded-full bg-green-500 text-white text-sm  mt-4' type='button' onClick={() => append({drug: '', count: 1, unit: 'flacon', posology: ''})}>
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
      </form> */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex  rounded-md p-8 flex-col mt-8 w-2/3 text-sm">
            <FormField
                control={form.control}
                name="recommendation"
                render={({ field }) => (
                  <FormItem className='mt-8'>
                    <FormLabel>Recommendations</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Recommendations" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}  
              />
            <button className="py-2 px-4 rounded-full bg-green-500 text-lg font-semibold w-1/2 center mt-8 mx-auto" type='submit'>
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
                    "Send"
              }
            </button>
          </form>
        </Form>
      
    </div>
  )
}

export default AddRecommendation