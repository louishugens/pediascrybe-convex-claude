import EditPatient from "../../../../../../components/editPatient";
import prisma from "../../../../../../utils/prisma";
async function getPatient(patientId){
  const patient = await prisma.patient.findUnique({
    where:{
      id:patientId
    },
  })
  return patient
}

export const dynamic = 'force-dynamic';

const EditPatientPage = async ({params: {doctorId, patientId}}) => {
  const patient = await getPatient(patientId)
  return (
    <EditPatient patient={patient} doctorId={doctorId} />
  )
}

export default EditPatientPage