import { Suspense } from "react";
import UploadForm from "./upload-form";

type Params = Promise<{ patientId: string, appointmentId: string }>

export default async function UploadPage(props: { params: Params }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UploadPageContent params={props.params} />
    </Suspense>
  )
}

async function UploadPageContent({ params }: { params: Params }) {
  const { patientId, appointmentId } = await params;
  return <UploadForm patientId={patientId} appointmentId={appointmentId} />
}
