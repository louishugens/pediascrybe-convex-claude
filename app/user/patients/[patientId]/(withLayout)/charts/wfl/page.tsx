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

async function getReferenceData_0_2(sex: Patient["sex"]){
  const referenceData = await prisma.charts.findUnique({
    where:{
      id: (sex === 'female') ? 'gwfh_0_2' : 'bwfh_0_2'
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
  const referenceData_0_2 = await getReferenceData_0_2(patient?.sex ?? null);
  // console.log('referenceData :>> ', referenceData);


  let formatted: { length: number; value: number; }[] = []
  let formatted_0_2: { length: number; value: number; }[] = []

  appointments?.map(appointment =>{
    if(appointment.weight && appointment.height){
      let app = {length: appointment.height, value: appointment.weight}
      if(differenceInDays(appointment.startDate, patient?.birthdate ?? new Date()) < 365*2){
        formatted_0_2.push(app)
      }else{
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

  const formatReferenceData_0_2 = (data: charts, formatted: { length: number; value: number; }[]) => {
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

    for (let i = 0; i < maxLength; i++) {
      const lengthValue = 45 + (i * 0.5);
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
  const data_0_2 = referenceData_0_2 ? formatReferenceData_0_2(referenceData_0_2, formatted_0_2) : [];
  return (
    <>
    <Chart patient={patient} type="wfl0To2" title="Weight for Length (0-2 years)" ylabel={'Weight (kg)'} xlabel={'Length (cm)'} name={patient?.firstname ?? 'patient'}  data={data_0_2} yUnit={'kg'} xUnit={'cm'} showTitle={true} mesure={'length'} />
    <Chart patient={patient} type="wfl" title="Weight for Length (2-5 years)" ylabel={'Weight (kg)'} xlabel={'Length (cm)'} name={patient?.firstname ?? 'patient'}  data={data} yUnit={'kg'} xUnit={'cm'} showTitle={true} mesure={'length'} />
    </>
  )
}
 
export default WFLChart