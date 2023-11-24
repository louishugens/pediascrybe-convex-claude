import prisma from "@/utils/prisma";
import CreateReport from "@/components/createReport";

async function getPatient(patientId) {
  const patient = await prisma.patient.findUnique({
    where: {
      id: patientId,
    },
  });
  return patient;
}

async function getConsultations(patientId) {
  const consultations = await prisma.appointment.findMany({
    where: {
      patientId: patientId,
    },
  });
  return consultations;
}

const CreateReportPage = async ({params:{patientId}}) => {

  const patient = await getPatient(patientId)
  const consultations = await getConsultations(patientId)


  return ( 
    <CreateReport patientId={patientId} patient={patient} consultations={consultations} />
   );
}
 
export default CreateReportPage;