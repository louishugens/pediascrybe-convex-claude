
import prisma from '@/utils/prisma';
import AddPrescriptions from '@/components/addPrescriptions';
import AddRecommendation from '@/components/addRecommendation';
import { Suspense, ViewTransition } from 'react';
import GenericFormSkeleton from '@/components/skeletons/generic-form-skeleton';


async function getAppointment(appointmentId: string) {
  const appointment = await prisma.appointment.findUnique({
    where: {
      id: appointmentId
    },
  })
  return appointment
}

async function getPatient(patientId: string) {
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

type Params = Promise<{ patientId: string, appointmentId: string }>

const AddRecommendationPage = async (props: { params: Params }) => {
  // const params = await props.params;

  // const {
  //   patientId,
  //   appointmentId
  // } = params;

  // const appointment = await getAppointment(appointmentId)
  // const patient = await getPatient(patientId)

  return (
    <ViewTransition>
      <Suspense fallback={<GenericFormSkeleton />}>
        <AddRecommendationContainer params={props.params} />
      </Suspense>
    </ViewTransition>
  );
}

export default AddRecommendationPage

async function AddRecommendationContainer({ params }: { params: Params }) {
  'use cache'
  const { patientId, appointmentId } = await params;

  const appointment = await getAppointment(appointmentId)
  const patient = await getPatient(patientId)

  return (
    <AddRecommendation appointment={appointment} patient={patient} patientId={patientId} data-superjson />
  );
} 