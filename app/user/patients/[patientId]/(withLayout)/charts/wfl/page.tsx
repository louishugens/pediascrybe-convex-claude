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

    if (Array.isArray(data.p03) && Array.isArray(data.height)) {

      for(let i = 0; i < data.p03.length; i ++){
        // let height = String(data.height[i])
        let height = parseFloat(String(data.height[i]))
        // console.log('height :>> ', height);
        if (!formatted[height]) {
          formatted[height] = { height, '3rd': 0, '15th': 0, '50th': 0, '85th': 0, '97th': 0};
          formatted[height][`${patient}`] = null
        }
        // console.log('data.p03[i] :>> ', data.p03[i]);
        formatted[height]['3rd'] += data.p03[i]
      }
    }

    if (Array.isArray(data.p15) && Array.isArray(data.height)) {
      
      for(let i = 0; i < data.p15.length; i ++){
        let height = String(data.height[i])
        formatted[height]['15th'] = data.p15[i]
      }
    }

    if (Array.isArray(data.p50)  && Array.isArray(data.height)) {
      for(let i = 0; i < data.p50.length; i ++){
        let height = String(data.height[i])
        formatted[height]['50th'] = data.p50[i]
      }
    }

    if (Array.isArray(data.p85) && Array.isArray(data.height)) {
      for(let i = 0; i < data.p85.length; i ++){
        let height = String(data.height[i])
        formatted[height]['85th'] = data.p85[i]
      }
    }

    if (Array.isArray(data.p97) && Array.isArray(data.height)) {
      for(let i = 0; i < data.p97.length; i ++){
        let height = String(data.height[i])
        formatted[height]['97th'] = data.p97[i]
      }
    }

    for(let i = 0; i < appointments.length; i++){
      if(appointments[i].height && appointments[i].weight){
        const height = appointments[i].height!!
        if (!formatted[height]) {
          formatted[height] = { height, '3rd': null, '15th': null, '50th': null, '85th': null, '97th': null};
          formatted[height][`${patient}`] = null
        }
        formatted[height][`${patient}`] = appointments[i].weight
      }
    }

    // sort by height
    formatted = Object.values(formatted).sort((a: { height: number }, b: { height: number }) => a.height - b.height);
    const result = Object.values(formatted);
    return result
  }

  const data = referenceData ? formatReferenceData(referenceData, patient?.firstname ?? '', patient?.appointments ?? [], patient?.birthdate!!) : null;

  return (
    <Chart patient={patient} type="wfa" title="Weight for lenght" unit={'kg'}  referenceData={data} />
  )
}
 
export default Charts