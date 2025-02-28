import Chart from "@/components/chartShad"
import prisma from "@/utils/prisma"
import { differenceInDays } from 'date-fns'
import { charts, Patient, Appointment } from '@prisma/client';

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
      id: (sex === 'female') ? 'gwfa' : 'bwfa'
    }
  })
  return referenceData
}

type Params = Promise<{ patientId: string }>

const Charts = async ({ params }: { params: Params }) => {
  const { patientId } = await params;

  const patient = await getPatient(patientId)
  const appointments = patient?.appointments
  const referenceData = await getReferenceData(patient?.sex ?? null);


  let formatted: { age: number; value: number; }[] = []

  appointments?.map(appointment =>{
    if(appointment.weight){
      let app = {age: differenceInDays(appointment.startDate, patient?.birthdate ?? new Date()), value: appointment.weight}
      formatted.push(app)
    }
  })

  // console.log(formatted)

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

  const data = referenceData ? formatReferenceData(referenceData, formatted) : [];


  return (
    <Chart patient={patient} type="wfa" title="Weight for Age" ylabel={'Weight (kg)'} xlabel={'Age (days)'} name={patient?.firstname ?? 'patient'}  data={data} showTitle={true} mesure={'age'} xUnit={'days'} yUnit={'kg'}   />
  );
}
 
export default Charts