import Chart from "@/components/chart"
import prisma from "@/utils/prisma"
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
  console.log('patientId :>> ', patientId);

  let formatted = []

  appointments.map(appointment =>{
    if(appointment.weight && appointment.height){
      let val = appointment.weight
      val = val / Math.pow(appointment.height / 100, 2)
      let app = {category: differenceInDays(appointment.startDate, patient.birthdate), value: val.toPrecision(5)}
      formatted.push(app)
    }  
  })

  console.log('bmi formatted :>> ', formatted);

  return (
    <Chart patient={patient} type="bfa" title="BMI for Age" ylabel="BMI (in kg/m^2)" xlabel="Age (in days)" formatted={formatted} name={patient.firstname} />
  )
}

export default Charts