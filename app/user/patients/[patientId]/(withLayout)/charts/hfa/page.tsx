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
      id: (sex === 'female') ? 'ghfa' : 'bhfa'
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
      console.log('hello :>>');
      for(let day = 0; day < data.p03.length; day++){
        if (!formatted[day]) {
          formatted[day] = { day, '3rd': 0, '15th': 0, '50th': 0, '85th': 0, '97th': 0};
          formatted[day][`${patient}`] = null
        }
        formatted[day]['3rd'] += data.p03[day]
      }
    }

    if (Array.isArray(data.p15)) {
      for(let i = 0; i < data.p15.length; i++){
        formatted[i]['15th'] = data.p15[i]
      }
    }

    if (Array.isArray(data.p50)) {
      for(let i = 0; i < data.p50.length; i++){
        formatted[i]['50th'] = data.p50[i]
      }
    }

    if (Array.isArray(data.p85)) {
      for(let i = 0; i < data.p85.length; i++){
        formatted[i]['85th'] = data.p85[i]
      }
    }

    if (Array.isArray(data.p97)) {
      for(let i = 0; i < data.p97.length; i++){
        formatted[i]['97th'] = data.p97[i]
      }
    }

    for(let i = 0; i < appointments.length; i++){
      const day = differenceInDays(appointments[i].startDate, birthdate || new Date())
      console.log('day :>> ', day);
      const height = appointments[i]?.height?.toString() ?? '';

      if(height){
        formatted[day][`${patient}`] = height
      }
    }

    const result = Object.values(formatted);
    return result
  }

  const data = referenceData ? formatReferenceData(referenceData, patient?.firstname ?? '', patient?.appointments ?? [], patient?.birthdate!!) : null;

  return (
    <Chart patient={patient} type="wfa" title="Height for Age" unit={'cm'}  referenceData={data} />
  )
}
 
export default Charts