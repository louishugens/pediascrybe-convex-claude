import Print from "@/components/printVaccines";
import { redirect } from "next/navigation";
import { Suspense, ViewTransition } from "react";
import PrintVaccinesSkeleton from "@/components/skeletons/print-vaccines-skeleton";
import { fetchAuthQuery } from "@/lib/auth-server";
import { api } from "@/convex/_generated/api";
import { getCurrentDoctor } from "@/lib/convex-data";
import { Id } from "@/convex/_generated/dataModel";

type Params = Promise<{ patientId: string, appointmentId: string }>

const PrintPage = async (props: { params: Params }) => {
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
  const doctor = await getCurrentDoctor();
  
  if (!doctor) {
    redirect('/');
  }

  const patient = await fetchAuthQuery(api.patients.getPatient, { 
    patientId: params.patientId as Id<"patients"> 
  });
  
  if (!patient) {
    redirect('/user/patients');
  }

  const vaccineRecords = await fetchAuthQuery(api.vaccines.getPatientVaccineRecords, { 
    patientId: params.patientId as Id<"patients"> 
  });

  return <Print patient={patient} doctor={doctor} vaccines={vaccineRecords} data-superjson />
}
