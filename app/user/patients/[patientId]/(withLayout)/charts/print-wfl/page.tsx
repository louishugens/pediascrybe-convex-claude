import Print from "@/components/printCharts";
import prisma from "@/utils/prisma";
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from "next/headers";

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
          height: 'asc'
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

  // console.log('appointments :>> ', appointments);
  appointments?.map(appointment =>{
    if(appointment.height && appointment.weight){
      
      let app = {category: Number.parseFloat(appointment.height.toFixed(1)), value: appointment.weight}

      formatted.push(app);
    }  
  })



  return (
    <>
      <Print type="wfl" title="Weight for Lenght" ylabel="Weight (in kg)" xlabel="Height (in cm)" patient={patient} doctor={doctor} formatted={formatted} data-superjson />
    </>
  );
};

export default PrintPage;


