import Print from "@/components/printCharts";
import prisma from "@/utils/prisma";
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from "next/headers";
import { differenceInDays } from 'date-fns'

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
    include: {
      appointments:{
        orderBy:{
          startDate: 'asc'
        }
      },
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

const PrintPage = async ({params: {patientId}}) => {
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


  const patient = await getPatient(patientId)
  const doctor = await getDoctor(doctorId)
  const appointments = patient?.appointments


  let formatted: { category: number; value: number; }[] = [];

  appointments?.map(appointment =>{
    if(appointment.weight){
      let app = {category: differenceInDays(appointment.startDate, patient?.birthdate ?? new Date()), value: appointment.weight}
      const formatted: { category: number; value: number; }[] = [];

    }  
  })

  return (
    <>
      <Print type="wfa" title="Weight for Age" ylabel="Weight (in kg)" xlabel="Age (in days)" patient={patient} doctor={doctor} formatted={formatted} data-superjson />
    </>
  );
};

export default PrintPage;


