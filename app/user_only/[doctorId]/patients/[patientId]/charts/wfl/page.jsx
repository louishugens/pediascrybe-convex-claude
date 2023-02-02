import Chart from "../../../../../../../components/chart"
import prisma from "../../../../../../../utils/prisma"

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

  let formatted = []

  appointments.map(appointment =>{
    if(appointment.height){
      
      let app = {category: appointment.height.toPrecision(3), value: appointment.weight}
      formatted.push(app)
    }  
  })

  console.log('formatted :>> ', formatted);

  return (
    <Chart sex={patient.sex} type="wfl" title="Weight for Lenght" ylabel="Weight (in kg)" xlabel="Height (in cm)" formatted={formatted} name={patient.firstname} />
  )
}

export default Charts