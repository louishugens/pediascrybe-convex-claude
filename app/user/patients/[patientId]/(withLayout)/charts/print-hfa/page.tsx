import Print from "@/components/printCharts2";
import prisma from "@/utils/prisma";
// import {createServerClient} from '@/utils/supabase-server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from "next/headers";
import { differenceInDays } from 'date-fns'
import { charts, Patient } from "@prisma/client";

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

async function getReferenceData(sex: Patient["sex"]){

  const referenceData = await prisma.charts.findUnique({
    where:{
      id: (sex === 'female') ? 'ghfa' : 'bhfa'
    }
  })
  return referenceData
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
  const referenceData = await getReferenceData(patient?.sex ?? null);


  let formatted: { category: number; value: number }[] = [] 

  appointments?.map(appointment =>{
    if(appointment.height){
      if(differenceInDays(appointment.startDate, patient?.birthdate ?? new Date()) / 30.4375 < 60){
        let app = {category: differenceInDays(appointment.startDate, patient?.birthdate ?? new Date()), value: appointment.height}
        formatted.push(app)
      }
    }
  })

  const formatReferenceData = (data: charts) => {

    type formattedPercentile = {
      category: number;
      value: number;
    }

    type formattedData = { name: string; data: formattedPercentile[] }

    const formatted: formattedData[] = []

    if (Array.isArray(data.p03)) {
      let percentile: formattedData = {name: `3rd`, data: []}
      for(let day = 0; day < data.p03.length; day++){
        if (data.p03[day]) {
          percentile.data.push({category: day, value: data.p03[day] as number})
        }
      }
      formatted.push(percentile)
    }

    if (Array.isArray(data.p15)) {
      let percentile: formattedData = {name: `15th`, data: []}
      for(let day = 0; day < data.p15.length; day++){
        if (data.p15[day]) {
          percentile.data.push({category: day, value: data.p15[day] as number})
        }
      }
      formatted.push(percentile)
    }
    if (Array.isArray(data.p50)) {
      let percentile: formattedData = {name: `50th`, data: []}
      for(let day = 0; day < data.p50.length; day++){
        if (data.p50[day]) {
          percentile.data.push({category: day, value: data.p50[day] as number})
        }
      }
      formatted.push(percentile)
    }
    if (Array.isArray(data.p85)) {
      let percentile: formattedData = {name: `85th`, data: []}
      for(let day = 0; day < data.p85.length; day++){
        if (data.p85[day]) {
          percentile.data.push({category: day, value: data.p85[day] as number})
        }
      }
      formatted.push(percentile)
    }
    if (Array.isArray(data.p97)) {
      let percentile: formattedData = {name: `97th`, data: []}
      for(let day = 0; day < data.p97.length; day++){
        if (data.p97[day]) {
          percentile.data.push({category: day, value: data.p97[day] as number})
        }
      }
      formatted.push(percentile)
    } 

    return formatted

  } 

  const data = referenceData ? formatReferenceData(referenceData) : null;

  return (
    <>
      <Print type="hfa" title="Height for Age (0-5 years)" ylabel="Height (in cm)" xlabel="Age (in days)" patient={patient} doctor={doctor} formatted={formatted} referenceData={data} data-superjson />
    </>
  );
};

export default PrintPage;


