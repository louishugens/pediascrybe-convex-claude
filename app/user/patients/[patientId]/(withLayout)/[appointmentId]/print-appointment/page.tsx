import Print from "@/components/printAppointment";
import prisma from "@/utils/prisma";
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'


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

const PrintPage = async ({params: { patientId, appointmentId}}) => {
  // const supabase = createServerClient()
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
  
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const doctorId = session?.user?.id

  let appointment = await getAppointment(appointmentId)
  const patient = await getPatient(patientId)
  const doctor = await getDoctor(doctorId)

  return (
    <>
      <Print appointment={appointment} patient={patient} doctor={doctor} data-superjson />
    </>
  );
};

export default PrintPage;