
import EditAppointment from "../../../../../../../components/editAppointment";
import prisma from "../../../../../../../utils/prisma";

async function getAppointment(appointmentId){
  const appointment = await prisma.appointment.findUnique({
    where:{
      id:appointmentId
    },
  })
  return appointment
}



export const dynamic = 'force-dynamic';


const EditAppointmentPage = async ({params: {doctorId, patientId, appointmentId}}) => {
  const appointment = await getAppointment(appointmentId)

  return (
    <EditAppointment appointment={appointment} doctorId={doctorId} patientId={patientId} data-superjson />
  )
}

export default EditAppointmentPage


