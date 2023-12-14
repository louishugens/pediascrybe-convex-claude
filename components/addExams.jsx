'use client'
import { useState, useEffect, startTransition } from 'react'
import { useForm, Control, useFieldArray, useWatch  } from 'react-hook-form';
import * as Yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup';
import { useRouter } from 'next/navigation'
import { BeatLoader } from 'react-spinners';
import { XCircleIcon } from '@heroicons/react/24/outline';
import { formatDistanceToNow } from "date-fns"
import PulseLoader from "react-spinners/PulseLoader"
import { refresh } from '@/app/actions';

const ExamsSchema =  Yup.object({
  exams: Yup.array().of(
    Yup.object().shape({
      exam: Yup.string().required('Please enter the exam'),
  })).required('Please add at least one exam').min(1, 'Please add at least one exam')
}).required();

const AddExams = ({patient, patientId, appointment}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [color, setColor] = useState('#ffffff')
  const router = useRouter()
  const [exams, setExams] = useState(appointment.exams || [{exam: null}])
  const [thinking, setThinking] = useState(false)

  const fetchExamsSuggestions = async () => {
    setThinking(true)
      const messages = [
        {
          role: "system",
          content: "As ScrybeGPT, a helpfu medical assistant, your task is to propose to a pediatrician a list of lab exams for a patient, based on their symptoms and diagnostics. Follow these steps:\
                    \
                    1. Identify the laguage used for the symptoms.\
                    2. Based on the age, symptoms, and diagnosis, determine an appropriate set of lab exams that should be conducted.\
                    3. Compile the recommended lab exams into a JSON array. The array should be in the format: [{exam: \"exam_name\"}, {exam: \"other_exam_name\"}].\
                    4. If no lab exams are necessary, send an empty JSON array.\
                    5. Ensure the JSON array is formatted correctly and contains only the required information.\
                    6. Translate the values for each key in the JSON array into the language used for the symptoms.\
                    \
                  Respond with the output in the same language as the symptoms and diagnostics. Only send the JSON array as the response."
        },
        {
          role: "user",
          content: `The patient is ${formatDistanceToNow(new Date(patient.birthdate))}`
        },
        {
          role: "user",
          content: appointment.motif ? `The patient symptoms are ${appointment.motif}` : ''
        },
        {
          role: "user",
          content: appointment.finding ? `The pediatrician's diagnostic is ${appointment.finding}` : ''
        },
        {
          role: "system",
          content: "Send the JSON array of lab exams as the response. Use the idenfied language for each key in the JSON array."
        }
        

        // {role: "system", content: "Generate a list of lab exams based on the patient's symptoms and diagnostics.\
        // provide it in JSON array format as follow: [{exam: \"urines\"}, {exam: \"X-ray\"}] 'exam'. \
        // send an empty array if no exams are suggested. Only send the JSON and nothing else"},
        // {role: "user", content: `The patient is ${formatDistanceToNow(new Date(patient.birthdate))}`},
        // {role: "user", content: appointment.motif ? `The patient symptoms are ${appointment.motif}` : ''},
        // {role: "user", content: appointment.finding ? `The pediatrician's diagnostic is ${appointment.finding}` : ''},
        // {role: "system", content: "Translate the exam values in the list in the language the symptoms and diagnostics are provided."},
      ]

      
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
        const myexams = JSON.parse(data)
        console.log('myexams :>> ', myexams);
        myexams.forEach(exam => {
          prepend(exam)
        }
        )
        setThinking(false)
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      }
  };

  // useEffect(() => {
  //   const fetchExamsSuggestions = async () => {
  //     setThinking(true)
  //       const messages = [
  //         {role: "system", content: "Generate a list of lab exams based on the patient's symptoms and diagnostics.\
  //         provide it in JSON array format as follow: [{exam: \"urines\"}, {exam: \"X-ray\"}] 'exam'. \
  //         send an empty array if no exams are suggested. Only send the JSON and nothing else"},
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

  //       fetchExamsSuggestions();

  // }, [patient.birthdate]);

  // console.log('user :>> ', user);
  // console.log('day :>> ', day);
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    control,
  } = useForm({
    resolver: yupResolver(ExamsSchema),
    defaultValues: {
      exams: exams,
    },
  });

  const { fields, append, prepend, remove } = useFieldArray({
    name: "exams",
    control,
    rules: {
      required: "Please append at least 1 exam"
    }
  });

  const onSubmit = async values => {
    setLoading(true)
 
    try{
      const {exams } = values
      console.log('exams :>> ', exams.length);

      const body = {exams, appointmentId: appointment.id}
      const myuser = await fetch('/api/patients/addExams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const newuser = await myuser.json()

      refresh([`/user/patients/${patientId}/${appointment.id}`, `/user/patients/${appointment.patientId}/${appointment.id}/add-exams`])

      router.push(`/user/patients/${patientId}/${appointment.id}`)

    }
    catch(err){
      console.log(err)
    }
  }


  return (
    <div className="w-full h-auto shadow-md rounded-lg p-4 bg-slate-50 mt-4 text-sm">
      <p>Add exams </p>
      <form className='mt-4' onSubmit={handleSubmit(onSubmit)}>
      {/* {
        thinking 
        ?
          <span className=' font-light text-primary'> ScrybeGPT thinking <PulseLoader color={"#21C55D"} size={5} aria-label="Loading Spinner" data-testid="loader"/></span> 
        :
        <span className=' font-light text-primary'>Generate with ScrybeGPT? <span className='px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs cursor-pointer'  onClick={fetchExamsSuggestions}>Yes</span></span>
      } */}
      {fields.map((field, index) => {
        return (
          <section key={field.id} className="relative pt-8">
            <XCircleIcon className='h-6 w-6 text-red-500 absolute right-0 top-0 mt-4 mr-4 cursor-pointer' onClick={() => remove(index)}/>
            <div className='w-full'>
              <label className="flex flex-col mb-4 h-16">
                <span className='font-medium text-sm'>Exam {index + 1}</span>
                <input placeholder='Urines' className='placeholder:italic placeholder:text-sm bg-white shadow-md rounded-full text-sm py-1 px-4' type='text' {...register(`exams.${index}.exam`)}/>
                <p className='px-4 pt-1 text-sm text-red-600'>{errors?.exams?.[index]?.exam?.message}</p>
              </label>
            </div>
          </section>
          )
        })}
        <p className='px-4 pt-1 text-sm text-red-600'>{errors?.exams?.message}</p>
        <div className="flex flex-row justify-between">
          <button className='py-1 px-4 rounded-full bg-green-500 text-white text-sm  mt-4' type='button' onClick={() => append({exam: ''})}>
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

export default AddExams