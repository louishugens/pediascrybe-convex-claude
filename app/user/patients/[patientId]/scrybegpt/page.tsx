import { getPatient } from "@/db/queries";
import Chat from "@/components/chat-component";

type Params = Promise<{ patientId: string }>

export default async function Page(props: { params: Params }) {
  const params = await props.params;

  const {
    patientId
  } = params;

  const patient = await getPatient(patientId)

  return (
    <div className="flex flex-col h-full">
      <Chat patientId={patientId} firstname={patient?.firstname ?? ""} lastname={patient?.lastname ?? ""} />
    </div>
  )
}