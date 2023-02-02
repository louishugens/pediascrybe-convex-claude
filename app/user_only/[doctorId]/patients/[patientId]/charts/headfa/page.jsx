import Chart from "../../../../../../../components/chart"
import prisma from "../../../../../../../utils/prisma"
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

const Charts = async ({params: {patientId}}) => {
  const patient = await getPatient(patientId)
  const appointments = patient.appointments

  let formatted = []

  appointments.map(appointment =>{
    if(appointment.weight){
      let app = {category: differenceInDays(appointment.startDate, patient.birthdate), value: appointment.head}
      formatted.push(app)
    }  
  })

  return (
    <Chart sex={patient.sex} type="hcfa" title="Head Circumference for Age" ylabel="HC (in cm)" xlabel="Age (in days)" formatted={formatted} name={patient.firstname}/>
  )
}

export default Charts