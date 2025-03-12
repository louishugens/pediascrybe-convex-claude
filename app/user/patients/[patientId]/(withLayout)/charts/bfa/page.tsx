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
      id: (sex === 'female') ? 'gbfa' : 'bbfa'
    }
  })
  return referenceData
}

async function getReferenceData5To19(sex: Patient["sex"]){

  const referenceData = await prisma.charts.findUnique({
    where:{
      id: (sex === 'female') ? 'gbfa_5_19' : 'bbfa_5_19'
    }
  })
  return referenceData
}

type Params = Promise<{ patientId: string }>

const BFAChart = async ({ params }: { params: Params }) => {
  const { patientId } = await params;

  const patient = await getPatient(patientId)
  const appointments = patient?.appointments
  const referenceData = await getReferenceData(patient?.sex ?? null);
  const referenceData5To19 = await getReferenceData5To19(patient?.sex ?? null);

  let formatted: { age: number; value: number; }[] = []
  let formatted5To19: { age: number; value: number; }[] = []

  appointments?.map(appointment =>{
    if(appointment.weight && appointment.height){
      let val = appointment.weight
      val = val / Math.pow(appointment.height / 100, 2)
      if(differenceInDays(appointment.startDate, patient?.birthdate!!) / 30.4375 > 60){
        let app = {age: Math.floor(differenceInDays(appointment.startDate, patient?.birthdate!!)/30.4375), value: parseFloat(val.toPrecision(5))}
        formatted5To19.push(app)
      }else{
        let app = {age: differenceInDays(appointment.startDate, patient?.birthdate!!), value: parseFloat(val.toPrecision(5))}
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

  const formatReferenceData5To19 = (data: charts, formatted5To19: { age: number; value: number; }[]) => {
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
      const patientDataForDay = formatted5To19.find(item => item.age === index);


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
  };

  const data = referenceData ? formatReferenceData(referenceData, formatted) : null;
  const data5To19 = referenceData5To19 ? formatReferenceData5To19(referenceData5To19, formatted5To19) : null;


  return (
    <>
      <Chart patient={patient} title="BMI for Age (0-5 years)"  type="bfa"  ylabel="BMI (in kg/m^2)" xlabel="Age (in days)" name={patient?.firstname} data={data} yUnit={'kg/m^2'} xUnit={'days'} showTitle={true} mesure={'age'} />
      <Chart patient={patient} title="BMI for Age (5-19 years)"  type="bfa5To19"  ylabel="BMI (in kg/m^2)" xlabel="Age (in months)" name={patient?.firstname} data={data5To19} yUnit={'kg/m^2'} xUnit={'months'} showTitle={true} mesure={'age'} />
    </>
  )
}
 
export default BFAChart