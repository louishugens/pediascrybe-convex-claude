import AddExams from "@/components/addExams";
import { Suspense, ViewTransition } from 'react';
import GenericFormSkeleton from '@/components/skeletons/generic-form-skeleton';
import { fetchAuthQuery } from '@/lib/auth-server';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

type Params = Promise<{ patientId: string }>

const StandaloneAddExamsPage = async (props: { params: Params }) => {
  return (
    <ViewTransition>
      <Suspense fallback={<GenericFormSkeleton />}>
        <Container params={props.params} />
      </Suspense>
    </ViewTransition>
  )
}

export default StandaloneAddExamsPage

async function Container({ params }: { params: Params }) {
  const { patientId } = await params;

  const patient = await fetchAuthQuery(api.patients.getPatient, {
    patientId: patientId as Id<"patients">,
  });

  if (!patient) {
    return <div>Patient not found.</div>
  }

  return (
    <AddExams patient={patient} patientId={patientId} data-superjson />
  );
}
