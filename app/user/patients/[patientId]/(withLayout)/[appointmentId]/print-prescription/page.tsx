import Print from "@/components/print";
import prisma from "@/utils/prisma";
import { createClient } from '@/utils/supabase/server'

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
export const dynamic = 'force-dynamic';

type Params = Promise<{ patientId: string, appointmentId: string }>

const PrintPage = async (props: { params: Params }) => {
  const params = await props.params;

  const {
    patientId,
    appointmentId
  } = params;

  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const doctorId = session?.user?.id

  let appointment = await getAppointment(appointmentId)
  const patient = await getPatient(patientId)
  const doctor = await getDoctor(doctorId)
  return (
    <>
      <Print appointment={appointment} patient={patient} doctor={doctor} exams={false} data-superjson />
    </>
  );
};

export default PrintPage;


