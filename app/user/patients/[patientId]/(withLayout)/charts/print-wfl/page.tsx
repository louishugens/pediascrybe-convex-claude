import Print from "@/components/printCharts";
import prisma from "@/utils/prisma";
import { createClient } from '@/utils/supabase/server'
import { Patient, charts } from "@prisma/client";
import { differenceInDays } from "date-fns";
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

async function getReferenceData(sex: Patient["sex"]){

  const referenceData = await prisma.charts.findUnique({
    where:{
      id: (sex === 'female') ? 'gwfh' : 'bwfh'
    }
  })
  return referenceData
}

export const dynamic = 'force-dynamic';

const PrintPage = async props => {
  const params = await props.params;

  const {
    patientId
  } = params;

  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const doctorId = session?.user?.id


  const patient = await getPatient(patientId)
  const doctor = await getDoctor(doctorId)
  const appointments = patient?.appointments
  const referenceData = await getReferenceData(patient?.sex ?? null);

  let formatted: { length: number; value: number; }[] = []

  appointments?.map(appointment =>{
    if(appointment.weight && appointment.height){
      let app = {length: appointment.height, value: appointment.weight}
      if(differenceInDays(appointment.startDate, patient?.birthdate ?? new Date()) > 365*2){
        formatted.push(app)
      }
    }
  })

  const formatReferenceData = (data: charts, formatted: { length: number; value: number; }[]) => {
    const format: { 
      length: number | undefined; 
      '3rd': number | undefined; 
      '15th': number | undefined; 
      '50th': number | undefined; 
      '85th': number | undefined; 
      '97th': number | undefined; 
      [key: string]: number | undefined
    }[] = [];

    const maxLength = Math.max(
      (data.p03 as number[])?.length || 0,
      (data.p15 as number[])?.length || 0,
      (data.p50 as number[])?.length || 0,
      (data.p85 as number[])?.length || 0,
      (data.p97 as number[])?.length || 0
    );

    // Start at 45 cm and increment by 0.1 cm
    for (let i = 0; i < maxLength; i++) {
      const lengthValue = 65 + (i * 0.1);
      const patientDataForDay = formatted.find(item => Math.abs(item.length - lengthValue) < 0.05);

      format.push({ 
        length: lengthValue, 
        '3rd': data.p03?.[i] ?? null, 
        '15th': data.p15?.[i] ?? null, 
        '50th': data.p50?.[i] ?? null, 
        '85th': data.p85?.[i] ?? null, 
        '97th': data.p97?.[i] ?? null,
        [patient?.firstname ?? 'patient']: patientDataForDay?.value ?? null
      });
    }

    return format;
  };

  const data = referenceData ? formatReferenceData(referenceData, formatted) : [];



  return (
    <>
      <Print type="wfl" title="Weight for Lenght" ylabel="Weight (in kg)" xlabel="Height (in cm)" patient={patient} doctor={doctor} data={data} yUnit="kg" xUnit="cm" mesure="length" />
    </>
  );
};

export default PrintPage;


