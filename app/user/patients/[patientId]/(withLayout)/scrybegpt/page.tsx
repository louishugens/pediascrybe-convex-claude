import { ChatWindow } from "@/components/chatWindow"

type Params = Promise<{ patientId: string }>

export default async function Page(props: { params: Params }) {
  const params = await props.params;

  const {
    patientId
  } = params;

  return (
    <div className="flex flex-col h-full py-8">
      <ChatWindow 
        endpoint={`/api/chat/${patientId}/`}
        emptyStateComponent={<div className="grow"></div>}
      />
    </div>
  )
}