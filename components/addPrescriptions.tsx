'use client'
import { useState, useEffect } from 'react'
import { useForm, Control, useFieldArray, useWatch, FieldError  } from 'react-hook-form';
import * as Yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation'
import { BeatLoader } from 'react-spinners';
import { XCircleIcon } from '@heroicons/react/24/outline';
import { formatDistanceToNow, format } from "date-fns"
import PulseLoader from "react-spinners/PulseLoader"
import  * as z from "zod"
import { refresh } from '@/app/actions';
import { experimental_useObject as useObject } from '@ai-sdk/react';
import { prescriptionsSchema } from '@/app/api/ai/prescriptions/schema';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAIQueryAccess, useSubscriptionCheck } from '@/components/subscription-guard';
import { UpgradeModal } from '@/components/upgrade-modal';
import { useSubscriptionGuard } from '@/hooks/use-subscription-guard';
import { ArrowLeft, PlusIcon } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { Doc, Id } from '@/convex/_generated/dataModel';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type PatientType = Doc<"patients">;
type AppointmentType = Doc<"appointments"> & {
  prescriptions?: Doc<"prescriptions">[];
  labOrders?: Doc<"labOrders">[];
};


export const formSchema = z.object({
  prescriptions: z
    .array(
      z.object({
        drug: z.string().min(1).refine((value) => value.trim() !== "", {
          message: "Please enter the drug name",
        }),
        count: z
          .number()
          .min(1, { message: "Must be greater than 1" }),
        unit: z.string().min(1).default("flacon"),
        posology: z.string().min(1).refine((value) => value.trim() !== "", {
          message: "Please enter the posology",
        }),
      })
    )
    .min(1, {
      message: "Please add at least one prescription",
    }),
});


const AddPrescriptions = ({patient, patientId, appointment}: {patient: PatientType, patientId: string, appointment?: AppointmentType}) => {
  const [loading, setLoading] = useState(false)
  const [noReturn, setNoReturn] = useState(false)
  const [hasFetched, setHasFetched] = useState(false)
  const [color, setColor] = useState('#ffffff')
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const router = useRouter()
  const isStandalone = !appointment
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | undefined>(undefined)
  const patientAppointments = useQuery(
    api.appointments.listByPatient,
    isStandalone ? { patientId: patientId as Id<'patients'> } : 'skip',
  )
  const selectedAppointment = isStandalone
    ? patientAppointments?.find((a) => a._id === selectedAppointmentId)
    : appointment
  const [prescriptions, setPrescriptions] = useState(
    appointment && Array.isArray(appointment.prescriptions)
      ? appointment.prescriptions.map((p) => ({
          drug: p.drug,
          count: p.count,
          unit: p.unit,
          posology: p.posology,
        }))
      : []
  )
  // const [thinking, setThinking] = useState(false)
  let [generating, setGenerating] = useState(false)

  // Subscription checks
  const { isAllowed: canUseAI, reason: aiBlockReason, isLoading: checkingAccess } = useAIQueryAccess('ai_prescription');
  const { hasAccess: hasPrescriptionAccess, isLoading: checkingPrescriptionAccess } = useSubscriptionCheck('ai_prescription');
  const incrementAIQuery = useMutation(api.usage.incrementAIQuery);
  const { requireSubscription } = useSubscriptionGuard();
  const [showFeatureLockedModal, setShowFeatureLockedModal] = useState(false);

  const { object, submit, isLoading, stop } = useObject({
    api: '/api/ai/prescriptions',
    schema: z.object({ elements: z.array(prescriptionsSchema) }),
  });

  const fetchPrescriptionsSuggestions = async () => {
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
      patient:{
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
  };

  useEffect(() => {
    const prescriptions = object?.elements;
    if (prescriptions && Array.isArray(prescriptions) && prescriptions.length > 0) {
      setNoReturn(false);
      // Get current drug names for comparison
      const currentDrugNames = fields.map(f => f.drug?.trim().toLowerCase());
      prescriptions.forEach(prescription => {
        if (
          prescription &&
          typeof prescription.drug === 'string' &&
          typeof prescription.count === 'number' &&
          typeof prescription.unit === 'string' &&
          typeof prescription.posology === 'string'
        ) {
          const drugName = prescription.drug.trim().toLowerCase();
          if (
            drugName &&
            !currentDrugNames.includes(drugName)
          ) {
            prepend({
              drug: prescription.drug,
              count: prescription.count,
              unit: prescription.unit,
              posology: prescription.posology,
            });
          }
        }
      });
      return;
    }
    if (
      hasFetched &&
      !isLoading &&
      (!prescriptions || (Array.isArray(prescriptions) && prescriptions.length === 0))
    ) {
      setNoReturn(true);
    } else {
      setNoReturn(false);
    }
  }, [object, hasFetched, isLoading]);

  // useEffect(() => {
  //   const fetchPrescriptionsSuggestions = async () => {
  //     setThinking(true)

  //       const messages = [
  //         {role: "system", content: "Generate a list of drug prescriptions based on the patient's symptoms and diagnostics.\
  //         provide it in JSON array format as in the following example : [{drug: \"Paracetamol\", count: 1, unit: \"flacon\", posology: \"1 pill twice a day\"}, ... ] \
  //         send an empty array if no drugs are suggested. Only send the JSON and nothing else. Use same language as the one used in the symptoms and diagnostics."},
  //         {role: "user", content: `The patient is ${formatDistanceToNow(new Date(patient.birthdate))}`},
  //         {role: "user", content: appointment.motif ? `The patient symptoms are ${appointment.motif}` : ''},
  //         {role: "user", content: appointment.finding ? `The pediatrician's diagnostic is ${appointment.finding}` : ''},
  //         {role: "system", content: "Translate the list in the language the symptoms and diagnostics are provided."},
  //         // {
  //         //   role: "system",
  //         //   content: "As ScrybeGPT, your task is to generate a list of drug prescriptions for a patient, based on their symptoms and diagnostics. Follow these steps:\
  //         //             \
  //         //             1. Receive and understand the patient's age, symptoms, and pediatrician's diagnosis.\
  //         //             2. Based on the age, symptoms, and diagnosis, determine appropriate medications.\
  //         //             3. For each medication, decide the quantity (count), unit (e.g., flacon, pill), and posology (e.g., '1 pill twice a day').\
  //         //             4. Compile the medications into a JSON array. Each entry should include the drug name, count, unit, and posology.\
  //         //             5. If no medications are necessary, send an empty JSON array.\
  //         //             6. Ensure the JSON array is formatted correctly.\
  //         // \
  //         //           Provide the output in the same language as the symptoms and diagnostics. Only send the JSON array as the response."
  //         // },
  //         // {
  //         //   role: "user",
  //         //   content: `The patient is ${formatDistanceToNow(new Date(patient.birthdate))}`
  //         // },
  //         // {
  //         //   role: "user",
  //         //   content: appointment.motif ? `The patient symptoms are ${appointment.motif}` : ''
  //         // },
  //         // {
  //         //   role: "user",
  //         //   content: appointment.finding ? `The pediatrician's diagnostic is ${appointment.finding}` : ''
  //         // },
  //         // {
  //         //   role: "system",
  //         //   content: "Translate the list into the language the symptoms and diagnostics are provided."
  //         // }
          
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

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    control,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      prescriptions: [
        ...(
          Array.isArray(prescriptions)
            ? prescriptions
            : []
        ),
        { drug: '', count: undefined, unit: '', posology: '' }
      ],
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
    // Check prescription feature access
    if (!hasPrescriptionAccess) {
      setShowFeatureLockedModal(true);
      return;
    }
    // Check subscription before proceeding
    if (!requireSubscription("add prescriptions")) return;
    
    setLoading(true)
 
    try{
      const {prescriptions } = values

      const effectiveAppointmentId = appointment?._id ?? selectedAppointmentId ?? undefined
      const body: Record<string, unknown> = { prescriptions }
      if (effectiveAppointmentId) {
        body.appointmentId = effectiveAppointmentId
      } else {
        body.patientId = patientId
      }

      const myuser = await fetch('/api/patients/addPrescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const newuser = await myuser.json()

      if (effectiveAppointmentId) {
        refresh([`/user/patients/${patientId}/${effectiveAppointmentId}`, `/user/patients/${patientId}/${effectiveAppointmentId}/add-prescription`])
        router.push(`/user/patients/${patientId}/${effectiveAppointmentId}`)
      } else {
        refresh([`/user/patients/${patientId}/prescriptions`])
        router.push(`/user/patients/${patientId}/prescriptions`)
      }

    }
    catch(err){
      console.log(err)
    } finally {
      setLoading(false)
    }
  }

  // console.log('errors :>> ', errors?.prescriptions?.[4].count);


  const handleBack = () => {
    if (appointment?._id) {
      router.push(`/user/patients/${patientId}/${appointment._id}`);
    } else {
      router.push(`/user/patients/${patientId}/prescriptions`);
    }
  };

  return (
    <div className="pb-4">
    <div className="w-full h-auto shadow-md rounded-lg p-4 bg-slate-50 mt-4 text-sm">
      <div className="flex items-center justify-between mb-2">
        <p className='font-bold'>Add medicines</p>
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Return
        </button>
      </div>
      {isStandalone && (
        <div className="mt-2">
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
          <span className='font-light text-red-500'>No prescription suggestions could be generated for this patient.</span>
        ) : isLoading || checkingAccess ? (
          <span className='font-light text-primary flex flex-row gap-2 items-center justify-start'><span>ScrybeGPT thinking </span><Spinner aria-label="Loading Spinner" data-testid="loader"/></span>
        ) : (
          <span className='font-light text-primary flex flex-row gap-2 items-center justify-start'><span>Generate with ScrybeGPT? </span><span className='px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs cursor-pointer' onClick={fetchPrescriptionsSuggestions}>Yes</span></span>
        )
      }
      {fields.map((field, index) => {
        return (
          <div key={field.id} className="relative pt-8">
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
            
          </div>
          )
        })}
        <p className='px-4 pt-1 text-sm text-red-600'>{errors?.prescriptions?.root?.message as React.ReactNode}</p>
        <div className="flex flex-row justify-between">
          <button className='py-1 px-4 rounded-full bg-primary/70 hover:bg-primary text-primary-foreground text-sm  mt-4 flex flex-row gap-2 items-center justify-center' type='button' onClick={() => append({drug: '', count: 1, unit: 'flacon', posology: ''})}>
            <PlusIcon className='h-4 w-4' />
            Add Medicine
          </button>
          {<button className='py-1 px-4 rounded-full bg-primary text-primary-foreground text-sm  mt-4 flex flex-row gap-2 items-center justify-center' type='submit'>
            {
              loading
              ?
              <span className='flex flex-row gap-2 items-center justify-center'><span>Saving prescription </span><Spinner aria-label="Loading Spinner" data-testid="loader"/></span>
              :
                "Save Prescription"}
          </button>}
        </div>
      </form>
      
    </div>
    
    {/* Upgrade Modal for AI */}
    <UpgradeModal
      open={showUpgradeModal}
      onOpenChange={setShowUpgradeModal}
      reason={aiBlockReason?.includes('limit') ? 'ai_query_limit' : 'feature_locked'}
      featureName="AI Prescription Recommendations"
    />

    {/* Upgrade Modal for Feature Locked */}
    <UpgradeModal
      open={showFeatureLockedModal}
      onOpenChange={setShowFeatureLockedModal}
      reason="feature_locked"
      featureName="Prescriptions"
    />
    </div>
  )
}

export default AddPrescriptions