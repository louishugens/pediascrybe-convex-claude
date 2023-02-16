import Chart from "../../../../../../components/chart"
import prisma from "../../../../../../utils/prisma"
import { differenceInDays } from 'date-fns'

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

// async function getWfa(patient){
//   const res = await fetch('/api/charts/gwfadata');
//   if (!res.ok) {
//     // This will activate the closest `error.js` Error Boundary
//     throw new Error('Failed to fetch data');
//   }

//   return res.json();

// }

const Charts = async ({params: {patientId}}) => {
  const patient = await getPatient(patientId)
  const appointments = patient.appointments


  let formatted = []

  appointments.map(appointment =>{
    if(appointment.weight){
      let app = {category: differenceInDays(appointment.startDate, patient.birthdate), value: appointment.weight}
      formatted.push(app)
    }  
  })

  return (
    <Chart sex={patient.sex} type="wfa" title="Weight for Age" ylabel="Weight (in kg)" xlabel="Age (in days)" formatted={formatted} name={patient.firstname} />
  )
}

export default Charts