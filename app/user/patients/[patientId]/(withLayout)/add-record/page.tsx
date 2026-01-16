import AddAppointment from '@/components/add-appointment'
import { redirect } from 'next/navigation'
import { Suspense, ViewTransition } from 'react'
import { AddRecordSkeleton } from '@/components/skeletons/add-record-skeleton'
import { getCurrentDoctor } from '@/lib/convex-data'
import { fetchAuthQuery } from '@/lib/auth-server'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'

type Params = Promise<{ patientId: string }>

export default async function AddRecordPage(props: { params: Params }) {
  return (
    <ViewTransition>
      <Suspense fallback={<AddRecordSkeleton />}>
        <AddRecordContainer params={props.params} />
      </Suspense>
    </ViewTransition>
  )
}

async function AddRecordContainer({ params }: { params: Params }) {
  const doctor = await getCurrentDoctor()

  if (!doctor) {
    redirect('/')
  }

  const { patientId } = await params;

  const [patient, services] = await Promise.all([
    fetchAuthQuery(api.patients.getPatientWithAppointments, { 
      patientId: patientId as Id<"patients"> 
    }),
    fetchAuthQuery(api.services.getServicesByDoctorId, { 
      doctorId: doctor._id 
    }),
  ])

  return (
    <AddAppointment 
      doctorId={doctor._id} 
      patientId={patientId as Id<"patients">} 
      patient={patient} 
      services={services} 
    />
  )
}
