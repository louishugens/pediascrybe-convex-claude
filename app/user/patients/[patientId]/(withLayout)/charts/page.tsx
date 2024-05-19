import Chart from "@/components/chart1"
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

const Charts = async ({params: {patientId}}) => {
  const patient = await getPatient(patientId)
  const appointments = patient?.appointments
  const referenceData = await getReferenceData(patient?.sex ?? null);


  let formatted: { category: number; value: number; }[] = []

  appointments?.map(appointment =>{
    if(appointment.weight){
      let app = {category: differenceInDays(appointment.startDate, patient?.birthdate ?? new Date()), value: appointment.weight}
      formatted.push(app)
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
    <Chart patient={patient} type="wfa" title="Weight for Age" ylabel="Weight (in kg)" xlabel="Age (in days)" name={patient?.firstname} formatted={formatted}  referenceData={data} />
    // <Chart patient={patient} type="wfa" title="Weight for Age" unit={'kg'}  referenceData={data} />
  )
}
 
export default Charts