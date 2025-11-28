import Print from "@/components/print";
import prisma from "@/utils/prisma";
import { createClient } from '@/utils/supabase/server'
import { Suspense, ViewTransition } from "react";
import PrintExamSkeleton from "@/components/skeletons/print-exam-skeleton";


async function getAppointment(appointmentId) {
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
      id: patientId
    },
  })
  return patient
}

async function getDoctor(doctorId: string) {
  const doctor = await prisma.doctor.findUnique({
    where: {
      id: doctorId
    },
  })
  return doctor
}


type Params = Promise<{ patientId: string, appointmentId: string }>

const PrintPage = async (props: { params: Params }) => {
  // const params = await props.params;

  // const {
  //   patientId,
  //   appointmentId
  // } = params;

  // const supabase = await createClient()

  // const {
  //   data: { user },
  // } = await supabase.auth.getUser()

  // const doctorId = user?.id

  // let appointment = await getAppointment(appointmentId)
  // const patient = await getPatient(patientId)
  // const doctor = await getDoctor(doctorId as string)

  return (
    <>
      <ViewTransition>
        <Suspense fallback={<PrintExamSkeleton />}>
          <PrintContainer params={props.params} />
        </Suspense>
      </ViewTransition>
    </>
  );
};

export default PrintPage;


async function PrintContainer({ params }: { params: Params }) {

  const { patientId, appointmentId } = await params;
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const doctorId = user?.id

  const appointment = await getAppointment(appointmentId)
  const patient = await getPatient(patientId)
  const doctor = await getDoctor(doctorId as string)
  return (
    <Print appointment={appointment} patient={patient} doctor={doctor} exams={true} data-superjson />
  );
}

