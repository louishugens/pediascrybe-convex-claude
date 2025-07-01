import Print from "@/components/printCharts";
import prisma from "@/utils/prisma";
import { createClient } from '@/utils/supabase/server'
import { charts, Patient } from "@prisma/client";
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

async function getReferenceData(sex: Patient["sex"]){

  const referenceData = await prisma.charts.findUnique({
    where:{
      id: (sex === 'female') ? 'gbfa' : 'bbfa'
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
    data: { user },
  } = await supabase.auth.getUser()

  const doctorId = user?.id


  const patient = await getPatient(patientId)
  const doctor = await getDoctor(doctorId)
  const appointments = patient?.appointments
  const referenceData = await getReferenceData(patient?.sex ?? null);

  let formatted: { age: number; value: number }[] = [] // Fix: Specify the type of the `formatted` array

  appointments?.map(appointment =>{
    if(appointment.weight && appointment.height){
      let val = appointment.weight
      // console.log('val :>> ', val);
      val = val / Math.pow(appointment.height / 100, 2)
      let app = {age: differenceInDays(appointment.startDate, patient?.birthdate || new Date()), value: parseFloat(val.toPrecision(5))}
      formatted.push(app) // Fix: Push the `app` object to the `formatted` array
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

    for (let index = 0; index < maxLength; index++) {
      const patientDataForDay = formatted.find(item => item.age === index);


      format.push({ 
        age: index, 
        '3rd': data.p03?.[index] ?? null, 
        '15th': data.p15?.[index] ?? null, 
        '50th': data.p50?.[index] ?? null, 
        '85th': data.p85?.[index] ?? null, 
        '97th': data.p97?.[index] ?? null,
        [patient?.firstname ?? 'patient']: patientDataForDay?.value ?? null
      });
    }

    return format;
  };

  const data = referenceData ? formatReferenceData(referenceData, formatted) : null;

  return (
    <>
      <Print type="bfa" title="BMI for Age" ylabel="BMI (in kg/m^2)" xlabel="Age (in days)" patient={patient} doctor={doctor} data={data} yUnit={'kg/m^2'} xUnit={'days'} mesure={'age'} />
    </>
  );
};

export default PrintPage;


