import AddPrescriptions from '@/components/addPrescriptions';
import { Suspense, ViewTransition } from 'react';
import GenericFormSkeleton from '@/components/skeletons/generic-form-skeleton';
import { fetchAuthQuery } from '@/lib/auth-server';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

type Params = Promise<{ patientId: string, appointmentId: string }>

const AddPrescriptionsPage = async (props: { params: Params }) => {
  return (
    <ViewTransition>
      <Suspense fallback={<GenericFormSkeleton />}>
        <AddPrescriptionsContainer params={props.params} />
      </Suspense>
    </ViewTransition>
  )
}

export default AddPrescriptionsPage

async function AddPrescriptionsContainer({ params }: { params: Params }) {
  const { patientId, appointmentId } = await params;

  const appointment = await fetchAuthQuery(api.appointments.getAppointment, { 
    appointmentId: appointmentId as Id<"appointments"> 
  });
  const patient = await fetchAuthQuery(api.patients.getPatient, { 
    patientId: patientId as Id<"patients"> 
  });
  
  if (!appointment || !patient) {
    return <div>Appointment or patient not found.</div>
  }

  return (
    <AddPrescriptions appointment={appointment} patient={patient} patientId={patientId} data-superjson />
  );
}
