import Chat from "@/components/chat-component";
import { Suspense, ViewTransition } from "react";
import ChatSkeleton from "@/components/skeletons/chat-skeleton";
import { fetchAuthQuery } from "@/lib/auth-server";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

type Params = Promise<{ patientId: string }>

export default async function Page(props: { params: Params }) {
  return (
    <div className="flex flex-col h-full">
      <ViewTransition>
        <Suspense fallback={<ChatSkeleton />}>
          <ChatContainer params={props.params} />
        </Suspense>
      </ViewTransition>
    </div>
  )
}

async function ChatContainer({ params }: { params: Params }) {
  'use cache'
  const { patientId } = await params;
  const patient = await fetchAuthQuery(api.patients.getPatient, { 
    patientId: patientId as Id<"patients"> 
  });
  return <Chat patientId={patientId} firstname={patient?.firstname ?? ""} lastname={patient?.lastname ?? ""} />
}
