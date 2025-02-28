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
      id: (sex === 'female') ? 'ghfa' : 'bhfa'
    }
  })
  return referenceData
}

async function getReferenceData5To19(sex: Patient["sex"]){

  const referenceData = await prisma.charts.findUnique({
    where:{
      id: (sex === 'female') ? 'ghfa_5_19' : 'bhfa_5_19'
    }
  })
  return referenceData
}

type Params = Promise<{ patientId: string }>

const HFAChart = async ({ params }: { params: Params }) => {
  const { patientId } = await params;

  const patient = await getPatient(patientId)
  const appointments = patient?.appointments
  const referenceData = await getReferenceData(patient?.sex ?? null);
  const referenceData5To19 = await getReferenceData5To19(patient?.sex ?? null);



  let formatted: { age: number; value: number; }[] = []
  let formatted5To19: { age: number; value: number; }[] = []

  appointments?.map(appointment =>{
    if(appointment.height){
      if(differenceInDays(appointment.startDate, patient?.birthdate ?? new Date()) / 30.4375 > 60){
        let app = {age: Math.floor(differenceInDays(appointment.startDate, patient?.birthdate ?? new Date())/30.4375), value: appointment.height}
        formatted5To19.push(app)
      }else{
        let app = {age: differenceInDays(appointment.startDate, patient?.birthdate ?? new Date()), value: appointment.height}
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

    for (let index = 60; index < maxLength; index++) {
      const patientDataForDay = formatted5To19.find(item => item.age === index);


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

  // const formatReferenceData = (data: charts) => {

  //   type formattedPercentile = {
  //     category: number;
  //     value: number;
  //   }

  //   type formattedData = { name: string; data: formattedPercentile[] }

  //   const formatted: formattedData[] = []

  //   if (Array.isArray(data.p03)) {
  //     let percentile: formattedData = {name: `3rd`, data: []}
  //     for(let day = 0; day < data.p03.length; day++){
  //       if (data.p03[day]) {
  //         percentile.data.push({category: day, value: data.p03[day] as number})
  //       }
  //     }
  //     formatted.push(percentile)
  //   }
  //   if (Array.isArray(data.p15)) {
  //     let percentile: formattedData = {name: `15th`, data: []}
  //     for(let day = 0; day < data.p15.length; day++){
  //       if (data.p15[day]) {
  //         percentile.data.push({category: day, value: data.p15[day] as number})
  //       }
  //     }
  //     formatted.push(percentile)
  //   }
  //   if (Array.isArray(data.p50)) {
  //     let percentile: formattedData = {name: `50th`, data: []}
  //     for(let day = 0; day < data.p50.length; day++){
  //       if (data.p50[day]) {
  //         percentile.data.push({category: day, value: data.p50[day] as number})
  //       }
  //     }
  //     formatted.push(percentile)
  //   }
  //   if (Array.isArray(data.p85)) {
  //     let percentile: formattedData = {name: `85th`, data: []}
  //     for(let day = 0; day < data.p85.length; day++){
  //       if (data.p85[day]) {
  //         percentile.data.push({category: day, value: data.p85[day] as number})
  //       }
  //     }
  //     formatted.push(percentile)
  //   }
  //   if (Array.isArray(data.p97)) {
  //     let percentile: formattedData = {name: `97th`, data: []}
  //     for(let day = 0; day < data.p97.length; day++){
  //       if (data.p97[day]) {
  //         percentile.data.push({category: day, value: data.p97[day] as number})
  //       }
  //     }
  //     formatted.push(percentile)
  //   } 

  //   return formatted

  // }

  // const formatReferenceData5To19 = (data: charts) => {

  //   type formattedPercentile = {
  //     category: number;
  //     value: number;
  //   }

  //   type formattedData = { name: string; data: formattedPercentile[] }

  //   const formatted: formattedData[] = []

  //   if (Array.isArray(data.p03)) {
  //     let percentile: formattedData = {name: `3rd`, data: []}
  //     for(let day = 0; day < data.p03.length; day++){
  //       if (data.p03[day]) {
  //         percentile.data.push({category: day + 61, value: data.p03[day] as number})
  //       }
  //     }
  //     formatted.push(percentile)
  //   }

  //   if (Array.isArray(data.p15)) {
  //     let percentile: formattedData = {name: `15th`, data: []}
  //     for(let day = 0; day < data.p15.length; day++){
  //       if (data.p15[day]) {
  //         percentile.data.push({category: day + 61, value: data.p15[day] as number})
  //       }
  //     }
  //     formatted.push(percentile)
  //   }
  //   if (Array.isArray(data.p50)) {
  //     let percentile: formattedData = {name: `50th`, data: []}
  //     for(let day = 0; day < data.p50.length; day++){
  //       if (data.p50[day]) {
  //         percentile.data.push({category: day + 61, value: data.p50[day] as number})
  //       }
  //     }
  //     formatted.push(percentile)
  //   }
  //   if (Array.isArray(data.p85)) {
  //     let percentile: formattedData = {name: `85th`, data: []}
  //     for(let day = 0; day < data.p85.length; day++){
  //       if (data.p85[day]) {
  //         percentile.data.push({category: day + 61, value: data.p85[day] as number})
  //       }
  //     }
  //     formatted.push(percentile)
  //   }
  //   if (Array.isArray(data.p97)) {
  //     let percentile: formattedData = {name: `97th`, data: []}
  //     for(let day = 0; day < data.p97.length; day++){
  //       if (data.p97[day]) {
  //         percentile.data.push({category: day + 61, value: data.p97[day] as number})
  //       }
  //     }
  //     formatted.push(percentile)
  //   } 

  //   return formatted

  // }

  const data = referenceData ? formatReferenceData(referenceData, formatted) : null;
  const data5To19 = referenceData5To19 ? formatReferenceData5To19(referenceData5To19, formatted5To19) : null;

  return (
      <>
        <Chart patient={patient} type="hfa" title="Height for Age (0-5 years)" ylabel="Height (in cm)" xlabel="Age (in days)" name={patient?.firstname} data={data} showTitle={true} mesure={'age'} xUnit={'days'} yUnit={'cm'}/>
        <Chart patient={patient} type="hfa5To19" title="Height for Age (5-19 years)" ylabel="Height (in cm)" xlabel="Age (in months)" name={patient?.firstname} data={data5To19} showTitle={true} mesure={'age'} xUnit={'months'} yUnit={'cm'}/>
      </>
  )
}
 
export default HFAChart



