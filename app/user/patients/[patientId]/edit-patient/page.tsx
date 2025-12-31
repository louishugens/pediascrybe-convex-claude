import EditPatient from "@/components/editPatient";
import { Suspense, ViewTransition } from "react";
import GenericFormSkeleton from "@/components/skeletons/generic-form-skeleton";
import { getCurrentDoctor } from "@/lib/convex-data";
import { fetchAuthQuery } from "@/lib/auth-server";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

type Params = Promise<{ patientId: string }>

const EditPatientPage = async ({ params }: { params: Params }) => {
  return (
    <ViewTransition>
      <Suspense fallback={<GenericFormSkeleton />}>
        <EditPatientContainer params={params} />
      </Suspense>
    </ViewTransition>
  )
}

export default EditPatientPage

async function EditPatientContainer({ params }: { params: Params }) {
  const { patientId } = await params;
  const doctor = await getCurrentDoctor();

  if (!doctor) {
    return <div>Doctor not found</div>
  }

  const patient = await fetchAuthQuery(api.patients.getPatient, { 
    patientId: patientId as Id<"patients"> 
  });

  if (!patient) {
    return <div>Patient not found</div>
  }

  return (
    <EditPatient patient={patient} doctorId={doctor._id} />
  )
}
