import Chart from "@/components/chartShad"
import prisma from "@/utils/prisma"
import { differenceInDays } from 'date-fns'
import { charts, Patient } from '@prisma/client';


async function getPatient(patientId){
  const patient = await prisma.patient.findUnique({
    where:{
      id: patientId
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
async function getReferenceData(sex: Patient["sex"]){

  const referenceData = await prisma.charts.findUnique({
    where:{
      id: (sex === 'female') ? 'ghcfa' : 'bhcfa'
    }
  })
  return referenceData
}

const Charts = async props => {
  const params = await props.params;

  const {
    patientId
  } = params;

  const patient = await getPatient(patientId)
  const appointments = patient?.appointments
  const referenceData = await getReferenceData(patient?.sex ?? null);
  let formatted: { age: number; value: number; }[] = []

  appointments?.map(appointment =>{
    if(appointment.head){
      let app = {age: differenceInDays(appointment.startDate, patient?.birthdate ?? new Date()), value: appointment.head}
      formatted.push(app)
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
    <Chart patient={patient} type="hcfa" title="Head Circumference for Age" ylabel="HC (in cm)" xlabel="Age (in days)" name={patient?.firstname} data={data} yUnit={'cm'} xUnit={'days'} showTitle={true} mesure={'age'}/>
  )
}

export default Charts