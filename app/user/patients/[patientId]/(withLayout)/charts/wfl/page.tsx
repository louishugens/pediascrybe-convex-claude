import Chart from "@/components/chart2"
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

const Charts = async ({params: {patientId}}) => {
  const patient = await getPatient(patientId)
  const appointments = patient?.appointments
  const referenceData = await getReferenceData(patient?.sex ?? null);
  // console.log('referenceData :>> ', referenceData);


  let formatted: { category: number; value: number; }[] = []

  appointments?.map(appointment =>{
    if(appointment.weight){
      let app = {category: differenceInDays(appointment.startDate, patient?.birthdate ?? new Date()), value: appointment.weight}
      formatted.push(app)
    }
  })

  const formatReferenceData = (data: charts, patient: string, appointments: Appointment[], birthdate: Date) => {
    
    let formatted = {}

    if (Array.isArray(data.p03)) {

      for(let height = 65; height < data.p03.length; height += 0.1){
        if (!formatted[height]) {
          formatted[height] = { height, '3rd': 0, '15th': 0, '50th': 0, '85th': 0, '97th': 0};
          formatted[height][`${patient}`] = null
        }
        formatted[Math.round(height)]['3rd'] += data.p03[Math.round(height)]
      }
    }

    if (Array.isArray(data.p15)) {
      for(let i = 65; i < data.p15.length; i += 0.1){
        formatted[i]['15th'] = data.p15[i]
      }
    }

    if (Array.isArray(data.p50)) {
      for(let i = 65; i < data.p50.length; i += 0.1){
        formatted[i]['50th'] = data.p50[i]
      }
    }

    if (Array.isArray(data.p85)) {
      for(let i = 65; i < data.p85.length; i += 0.1){
        formatted[i]['85th'] = data.p85[i]
      }
    }

    if (Array.isArray(data.p97)) {
      for(let i = 65; i < data.p97.length; i += 0.1){
        formatted[i]['97th'] = data.p97[i]
      }
    }

    // for(let i = 0; i < appointments.length; i++){
    //   const day = differenceInDays(appointments[i].startDate, birthdate || new Date())

    //   // const head = appointments[i]?.head?.toString() ?? '';

    //   if(appointments[i].height && appointments[i].weight){
    //     formatted[appointments[i].height!!][`${patient}`] = appointments[i].weight
    //   }
    // }

    const result = Object.values(formatted);
    return result
  }

  const data = referenceData ? formatReferenceData(referenceData, patient?.firstname ?? '', patient?.appointments ?? [], patient?.birthdate!!) : null;
  console.log('data :>> ', data);
  return (
    <Chart patient={patient} type="wfa" title="Weight for lenght" unit={'kg'}  referenceData={data} />
  )
}
 
export default Charts