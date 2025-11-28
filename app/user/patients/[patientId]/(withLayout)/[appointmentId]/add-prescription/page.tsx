import { db } from '@/db';
import AddPrescriptions from '@/components/addPrescriptions';
import {  getPatient } from '@/db/queries';
import { eq } from 'drizzle-orm';
import { Appointment } from '@/db/schema';
import { Suspense } from 'react';


async function getAppointment(appointmentId: string){
  const appointment = await db.query.Appointment.findFirst({
    where: eq(Appointment.id, appointmentId),
  })
  return appointment
}

type Params = Promise<{ patientId: string, appointmentId: string }>

const AddPrescriptionsPage = async (props: { params: Params }) => {

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AddPrescriptionsContainer params={props.params} />
    </Suspense>
  )
}


export default AddPrescriptionsPage

async function AddPrescriptionsContainer({ params }: { params: Params }) {
  'use cache'
  
  const { patientId, appointmentId } = await params;

  const appointment = await getAppointment(appointmentId)
  const patient = await getPatient(patientId)
  if (!appointment || !patient) {
    return <div>Appointment or patient not found.</div>
  }

  return (
    <AddPrescriptions appointment={appointment} patient={patient} patientId={patientId} data-superjson />
  );
}