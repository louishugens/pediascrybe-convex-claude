
import prisma from '../../../../../../../utils/prisma';
import AddPrescriptions from "../../../../../../../components/AddPrescriptions";

async function getAppointment(appointmentId){
  const appointment = await prisma.appointment.findUnique({
    where:{
      id:appointmentId
    },
  })
  return appointment
}



export const dynamic = 'force-dynamic';


const AddPrescriptionsPage = async ({params: {doctorId, patientId, appointmentId}}) => {
  const appointment = await getAppointment(appointmentId)

  return (
    <AddPrescriptions appointment={appointment} doctorId={doctorId} patientId={patientId} data-superjson />
  )
}

export default AddPrescriptionsPage