import Chart from "@/components/chart"
import prisma from "@/utils/prisma"

async function getPatient(patientId){
  const patient = await prisma.patient.findUnique({
    where:{
      id: patientId
    },
    include: {
      appointments:{
        orderBy:{
          height: 'asc'
        }
      },
    },
  })
  return patient
}

const Charts = async ({params: {patientId}}) => {
  const patient = await getPatient(patientId)
  const appointments = patient.appointments
  // console.log('appointments :>> ', appointments);

  let formatted = []

  appointments.map(appointment =>{
    if(appointment.height && appointment.weight){
      
      let app = {category: Number.parseFloat(appointment.height.toFixed(1)), value: appointment.weight}
      formatted.push(app)
    }  
  })



  return (
    <Chart patient={patient} type="wfl" title="Weight for Lenght" ylabel="Weight (in kg)" xlabel="Height (in cm)" formatted={formatted} name={patient.firstname} />
  )
}

export default Charts