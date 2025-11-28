import Print from "@/components/print";
import prisma from "@/utils/prisma";
import { createClient } from '@/utils/supabase/server'
import { Suspense } from "react";

async function getAppointment(appointmentId) {
  const appointment = await prisma.appointment.findUnique({
    where:{
      id:appointmentId
    },
  })
  return appointment
}

async function getPatient(patientId) {
  const patient = await prisma.patient.findUnique({
    where:{
      id:patientId
    },
  })
  return patient
}

async function getDoctor(doctorId) {
  const doctor = await prisma.doctor.findUnique({
    where:{
      id:doctorId
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
  // const doctor = await getDoctor(doctorId)

  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <PrintContainer params={props.params} />
      </Suspense>
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
  const doctor = await getDoctor(doctorId)
  return (
    <Print appointment={appointment} patient={patient} doctor={doctor} exams={false} data-superjson />
  );
}

