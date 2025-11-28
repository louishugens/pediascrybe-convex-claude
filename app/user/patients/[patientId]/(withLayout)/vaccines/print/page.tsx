import Print from "@/components/printVaccines";

import { getDoctor, getPatient, getPatientVaccineRecords } from "@/data/queries";
import { Patient, Doctor } from "@/db/schema";
import { redirect } from "next/navigation";
import { Suspense, ViewTransition } from "react";
import PrintVaccinesSkeleton from "@/components/skeletons/print-vaccines-skeleton";





type Params = Promise<{ patientId: string, appointmentId: string }>

const PrintPage = async (props: { params: Params }) => {
  // const params = await props.params;

  // const {
  //   patientId,
  //   appointmentId
  // } = params;


  // const patient: Patient | null = await getPatient(patientId)
  // const doctor: Doctor | null = await getDoctor()
  // const vaccineRecords = await getPatientVaccineRecords(patientId)

  // if (!patient) {
  //   redirect('/user/patients')
  // }
  // if (!doctor) {
  //   redirect('/')
  // }
  return (
    <>
      <ViewTransition>
        <Suspense fallback={<PrintVaccinesSkeleton />}>
          <PrintContainer params={props.params} />
        </Suspense>
      </ViewTransition>
    </>
  );
};

export default PrintPage;



async function PrintContainer(props: { params: Promise<{ patientId: string, appointmentId: string }> }) {
  const params = await props.params;
  const patient = await getPatient(params.patientId)
  const doctor = await getDoctor()
  const vaccineRecords = await getPatientVaccineRecords(params.patientId)
  if (!patient) {
    redirect('/user/patients')
  }
  if (!doctor) {
    redirect('/')
  }

  return <Print patient={patient} doctor={doctor} vaccines={vaccineRecords} data-superjson />
}
