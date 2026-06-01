'use client'

import { useState, useEffect } from 'react'
import { useForm, useFieldArray  } from 'react-hook-form';
import * as Yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup';
import { useRouter } from 'next/navigation'
import { BeatLoader } from 'react-spinners';
import { XCircleIcon } from '@heroicons/react/24/outline';
import { formatDistanceToNow, format } from "date-fns"
import { Spinner } from '@/components/ui/spinner';
import { refresh } from '@/app/actions';
import { experimental_useObject as useObject } from '@ai-sdk/react';
import { examsSchema } from '@/app/api/ai/exams/schema';
import { z } from 'zod';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAIQueryAccess } from '@/components/subscription-guard';
import { UpgradeModal } from '@/components/upgrade-modal';
import { useSubscriptionGuard } from '@/hooks/use-subscription-guard';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Id } from '@/convex/_generated/dataModel';

const ExamsSchema =  Yup.object({
  exams: Yup.array().of(
    Yup.object().shape({
      exam: Yup.string().required('Please enter the exam'),
  })).required('Please add at least one exam').min(1, 'Please add at least one exam')
}).required();

const AddExams = ({patient, patientId, appointment}: { patient: any; patientId: string; appointment?: any }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [color, setColor] = useState('#ffffff')
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const router = useRouter()
  // Standalone mode: no preset appointment — show the picker, default to "none".
  const isStandalone = !appointment
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | undefined>(undefined)
  const patientAppointments = useQuery(
    api.appointments.listByPatient,
    isStandalone ? { patientId: patientId as Id<'patients'> } : 'skip',
  )
  const selectedAppointment = isStandalone
    ? patientAppointments?.find((a) => a._id === selectedAppointmentId)
    : appointment
  const [exams, setExams] = useState(
    appointment && Array.isArray(appointment.labOrders) && appointment.labOrders.length > 0
      ? appointment.labOrders.map((o: { examName: string }) => ({ exam: o.examName }))
      : [{ exam: null }]
  )
  const [thinking, setThinking] = useState(false)
  const [hasFetched, setHasFetched] = useState(false)
  const [noReturn, setNoReturn] = useState(false)

  // Subscription checks
  const { isAllowed: canUseAI, reason: aiBlockReason, isLoading: checkingAccess } = useAIQueryAccess('ai_lab_exam');
  const incrementAIQuery = useMutation(api.usage.incrementAIQuery);
  const { requireSubscription } = useSubscriptionGuard();

  const { object, submit, isLoading, stop } = useObject({
    api: '/api/ai/exams',
    schema: z.object({ elements: z.array(examsSchema) }),
  });

  useEffect(() => {
    const exams = object?.elements;
    if (exams && Array.isArray(exams) && exams.length > 0) {
      setNoReturn(false);
      // Get current exam names for comparison
      const currentExamNames = fields.map(f => (f as { exam?: string }).exam?.trim().toLowerCase()).filter(Boolean);
      exams.forEach(exam => {
        const examName = exam?.exam?.trim().toLowerCase();
        if (examName && !currentExamNames.includes(examName)) {
          prepend(exam); // Add new unique exams to the top
        }
      });
      return;
    }
    if (
      hasFetched &&
      !isLoading &&
      (!exams || (Array.isArray(exams) && exams.length === 0))
    ) {
      setNoReturn(true);
    } else {
      setNoReturn(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [object, hasFetched, isLoading]);

  const fetchExamsSuggestions = async () => {
    // Check if user can use AI
    if (!canUseAI) {
      setShowUpgradeModal(true);
      return;
    }

    setHasFetched(true);
    
    // Increment AI query usage
    try {
      await incrementAIQuery({});
    } catch (error) {
      console.error('Failed to increment AI usage:', error);
    }

      const ctxAppt = selectedAppointment;
      const body = {
        patient: {
          age: formatDistanceToNow(new Date(patient.birthdate)),
          gender: patient.sex,
          allergies: patient.allergies,
          history: patient.history,
        },
        appointment: ctxAppt
          ? {
              motif: ctxAppt.motif,
              findings: ctxAppt.findings,
              height: ctxAppt.height,
              weight: ctxAppt.weight,
              headCircumference: ctxAppt.head,
              armCircumference: ctxAppt.arm,
              sao2: ctxAppt.sao2,
              temperature: ctxAppt.temperature,
              pulse: ctxAppt.pulse,
              respiratory: ctxAppt.respiratory,
              systolic: ctxAppt.systolic,
              diastolic: ctxAppt.diastolic,
            }
          : undefined,
      }
      submit(body)


      // object?.forEach(exam => {
      //   prepend(exam)
      // })
      // setThinking(false)
      
      // try {
      //   const response = await fetch('/api/diagnostic', {
      //     method: 'POST',
      //     headers: {
      //       'Content-Type': 'application/json',
      //     },
      //     body: JSON.stringify({messages})
      //   });
      //   const data = await response.json();
      //   console.log('data :>> ', data);
      //   const myexams = JSON.parse(data)
      //   console.log('myexams :>> ', myexams);
      //   myexams.forEach(exam => {
      //     prepend(exam)
      //   }
      //   )
      //   setThinking(false)
      // } catch (error) {
      //   console.error("Error fetching suggestions:", error);
      // }
  };


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
    // Check subscription before proceeding
    if (!requireSubscription("add lab exams")) return;
    
    setLoading(true)
 
    try{
      const {exams } = values

      // Pick the effective appointment: preset (in-visit) or user-picked (standalone).
      const effectiveAppointmentId = appointment?._id ?? selectedAppointmentId ?? undefined
      const body: Record<string, unknown> = { exams }
      if (effectiveAppointmentId) {
        body.appointmentId = effectiveAppointmentId
      } else {
        body.patientId = patientId
      }

      const myuser = await fetch('/api/patients/addExams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const newuser = await myuser.json()

      if (effectiveAppointmentId) {
        refresh([`/user/patients/${patientId}/${effectiveAppointmentId}`, `/user/patients/${patientId}/${effectiveAppointmentId}/add-exams`])
        router.push(`/user/patients/${patientId}/${effectiveAppointmentId}`)
      } else {
        refresh([`/user/patients/${patientId}/labs`])
        router.push(`/user/patients/${patientId}/labs`)
      }

    }
    catch(err){
      console.log(err)
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="pb-4">
    <div className="w-full h-auto shadow-md rounded-lg p-4 bg-slate-50 mt-4 text-sm">
      <p>Add exams </p>
      {isStandalone && (
        <div className="mt-4">
          <label className="flex flex-col gap-2">
            <span className="font-medium text-sm">Attach to consultation (optional)</span>
            <Select
              value={selectedAppointmentId ?? 'none'}
              onValueChange={(v) => setSelectedAppointmentId(v === 'none' ? undefined : v)}
            >
              <SelectTrigger className="bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Standalone (no consultation)</SelectItem>
                {(patientAppointments ?? []).map((a) => (
                  <SelectItem key={a._id} value={a._id}>
                    {format(new Date(a.startDate), 'MMM d, yyyy')}
                    {a.motif ? ` · ${a.motif}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        </div>
      )}
      <form className='mt-4' onSubmit={handleSubmit(onSubmit)}>
      {
        noReturn ? (
          <span className='font-light text-red-500'>No exam suggestions could be generated for this patient.</span>
        ) : isLoading || checkingAccess ? (
          <span className='font-light text-primary flex flex-row gap-2 items-center justify-start'><span>ScrybeGPT thinking </span><Spinner aria-label="Loading Spinner" data-testid="loader"/></span>
        ) : !canUseAI ? (
          <span className='font-light text-amber-600'>
            {aiBlockReason || 'AI features require a Pro subscription'}{' '}
            <span className='px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs cursor-pointer' onClick={() => setShowUpgradeModal(true)}>Upgrade</span>
          </span>
        ) : (
          <span className=' font-light text-primary'>Generate with ScrybeGPT? <span className='px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs cursor-pointer'  onClick={fetchExamsSuggestions}>Yes</span></span>
        )
      }
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
        <p className='px-4 pt-1 text-sm text-red-600'>{errors?.exams?.message?.toString()}</p>
        <div className="flex flex-row justify-between">
          <button className='py-1 px-4 rounded-full bg-primary text-primary-foreground text-sm  mt-4' type='button' onClick={() => append({exam: ''})}>
            Add
          </button>
          {<button className='py-1 px-4 rounded-full bg-primary text-primary-foreground text-sm  mt-4' type='submit'>
            {
              loading
              ?
              <span className='flex flex-row gap-2 items-center justify-center'><span>Saving exams </span><Spinner aria-label="Loading Spinner" data-testid="loader"/></span>
              :
                "Save Exams"}
          </button>}
        </div>
      </form>
      
    </div>
    
    {/* Upgrade Modal */}
    <UpgradeModal
      open={showUpgradeModal}
      onOpenChange={setShowUpgradeModal}
      reason={aiBlockReason?.includes('limit') ? 'ai_query_limit' : 'feature_locked'}
      featureName="AI Lab Exam Proposals"
    />
    </div>
  )
}

export default AddExams