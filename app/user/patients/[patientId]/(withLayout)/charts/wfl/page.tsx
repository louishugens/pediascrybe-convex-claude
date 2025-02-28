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
      id: (sex === 'female') ? 'gwfh' : 'bwfh'
    }
  })
  return referenceData
}

type Params = Promise<{ patientId: string }>

const WFLChart = async ({ params }: { params: Params }) => {
  const { patientId } = await params;
  const patient = await getPatient(patientId)
  const appointments = patient?.appointments
  const referenceData = await getReferenceData(patient?.sex ?? null);
  // console.log('referenceData :>> ', referenceData);


  let formatted: { length: number; value: number; }[] = []

  appointments?.map(appointment =>{
    if(appointment.weight && appointment.height){
      let app = {length: appointment.height, value: appointment.weight}
      formatted.push(app)
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
      const lengthValue = 45 + (i * 0.1);
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
    <Chart patient={patient} type="wfl" title="Weight for Length" ylabel={'Weight (kg)'} xlabel={'Length (cm)'} name={patient?.firstname ?? 'patient'}  data={data} yUnit={'kg'} xUnit={'cm'} showTitle={true} mesure={'length'} />
  )
}
 
export default WFLChart