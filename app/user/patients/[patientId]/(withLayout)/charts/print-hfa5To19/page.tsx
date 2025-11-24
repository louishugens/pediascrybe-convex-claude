import Print from "@/components/printCharts";
import prisma from "@/utils/prisma";
import { createClient } from '@/utils/supabase/server'
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
      id: (sex === 'female') ? 'ghfa_5_19' : 'bhfa_5_19'
    }
  })
  return referenceData
}



const PrintPage = async props => {
  const params = await props.params;

  const {
    patientId
  } = params;

  const supabase = await createClient()


  const {
    data: { user },
  } = await supabase.auth.getUser()

  const doctorId = user?.id


  const patient = await getPatient(patientId)
  const doctor = await getDoctor(doctorId)
  const appointments = patient?.appointments
  const referenceData = await getReferenceData(patient?.sex ?? null);


  let formatted: { age: number; value: number; }[] = []

  appointments?.map(appointment =>{
    if(appointment.height){
      if(differenceInDays(appointment.startDate, patient?.birthdate ?? new Date()) / 30.4375 > 60){
        let app = {age: Math.floor(differenceInDays(appointment.startDate, patient?.birthdate ?? new Date())/30.4375), value: appointment.height}
        formatted.push(app)
      }
    }
  })

  const formatReferenceData = (data: charts, formatted: { age: number; value: number; }[]) => {

    const format: { 
      age: number; 
      '3rd': number; 
      '15th': number; 
      '50th': number; 
      '85th': number; 
      '97th': number; 
      [key: string]: number 
    }[] = [];

    const maxLength = Math.max(
      (data.p03 as number[])?.length || 0,
      (data.p15 as number[])?.length || 0,
      (data.p50 as number[])?.length || 0,
      (data.p85 as number[])?.length || 0,
      (data.p97 as number[])?.length || 0
    );

    for (let index = 60; index < maxLength + 60; index++) {
      const patientDataForDay = formatted.find(item => item.age === index);


      format.push({ 
        age: index, 
        '3rd': data.p03?.[index - 60] ?? null, 
        '15th': data.p15?.[index - 60] ?? null, 
        '50th': data.p50?.[index - 60] ?? null, 
        '85th': data.p85?.[index - 60] ?? null, 
        '97th': data.p97?.[index - 60] ?? null,
        [patient?.firstname ?? 'patient']: patientDataForDay?.value ?? null
      });
    }

    return format;

  }

  const data = referenceData ? formatReferenceData(referenceData, formatted) : null;

  return (
    <>
      <Print type="hfa-5To19" title="Height for Age (5-19 years)" ylabel="Height (in cm)" xlabel="Age (in months)" patient={patient} doctor={doctor}  data={data} yUnit={'cm'} xUnit={'months'} mesure={'age'} />
    </>
  );
};

export default PrintPage;


