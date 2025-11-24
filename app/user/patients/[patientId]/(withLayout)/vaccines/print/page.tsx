import Print from "@/components/printVaccines";
import prisma from "@/utils/prisma";
import { getDoctor, getPatient, getPatientVaccineRecords } from "@/data/queries";
import { Patient, Doctor } from "@prisma/client";
import { redirect } from "next/navigation";





type Params = Promise<{ patientId: string, appointmentId: string }>

const PrintPage = async (props: { params: Params }) => {
  const params = await props.params;

  const {
    patientId,
    appointmentId
  } = params;


  const patient: Patient | null = await getPatient(patientId)
  const doctor: Doctor | null = await getDoctor()
  const vaccineRecords = await getPatientVaccineRecords(patientId)

  if (!patient) {
    redirect('/user/patients')
  }
  if (!doctor) {
    redirect('/')
  }
  return (
    <>
      <Print patient={patient} doctor={doctor} vaccines={vaccineRecords} data-superjson />
    </>
  );
};

export default PrintPage;


