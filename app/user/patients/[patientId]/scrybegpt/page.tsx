import { getPatient } from "@/db/queries";
import Chat from "@/components/chat-component";
import { Suspense } from "react";

type Params = Promise<{ patientId: string }>

export default async function Page(props: { params: Params }) {

  return (
    <div className="flex flex-col h-full">
      <Suspense fallback={<div>Loading...</div>}>
        <ChatContainer params={props.params} />
      </Suspense>
    </div>
  )
}

async function ChatContainer({ params }: { params: Params }) {
  'use cache'
  const { patientId } = await params;
  const patient = await getPatient(patientId)
  return <Chat patientId={patientId} firstname={patient?.firstname ?? ""} lastname={patient?.lastname ?? ""} />
}