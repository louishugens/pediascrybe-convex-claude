import AddAppointment from '@/components/add-appointment'
import prisma from '@/utils/prisma'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { getServicesByDoctorId } from '@/db/queries'
import { Suspense, ViewTransition } from 'react'
  
import { AddAppointmentSkeleton } from '@/components/skeletons/add-appointment-skeleton'

async function getPatient(patientId) {
  const patient = await prisma.patient.findUnique({
    where: {
      id: patientId,
    },
    include: {
      appointments: true,
    },
  })

  return patient
}

type Params = Promise<{ patientId: string }>

export default async function Appointment(props: { params: Params }) {


  return (
    <ViewTransition>
      <Suspense fallback={<AddAppointmentSkeleton />}>
        <AddAppointmentContainer params={props.params} />
      </Suspense>
    </ViewTransition>
  )
}

async function AddAppointmentContainer({ params }: { params: Params }) {


  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const doctorId = user?.id

  if (!doctorId) {
    redirect('/')
  }

  const { patientId } = await params;

  const patient = await getPatient(patientId)
  const services = await getServicesByDoctorId(doctorId)



  return (
    <AddAppointment doctorId={doctorId} patientId={patientId} patient={patient} services={services} />
  )
}