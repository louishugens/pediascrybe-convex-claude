import prisma from "@/utils/prisma";
import CreateReport from "@/components/createReport";
import { Suspense } from "react";

async function getPatient(patientId: string) {
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

type Params = Promise<{ patientId: string }>

const CreateReportPage = async (props: { params: Params }) => {
  // const params = await props.params;

  // const {
  //   patientId
  // } = params;

  // const patient = await getPatient(patientId)
  // const consultations = await getConsultations(patientId)


  return ( 
    <Suspense fallback={<div>Loading...</div>}>
      <CreateReportContainer params={props.params} />
    </Suspense>
   );
}
 
export default CreateReportPage;

async function CreateReportContainer({ params }: { params: Params }) {
  'use cache'
  const { patientId } = await params;

  const patient = await getPatient(patientId)
  const consultations = await getConsultations(patientId)
  return (
    <CreateReport patientId={patientId} patient={patient} consultations={consultations} />
  )
}