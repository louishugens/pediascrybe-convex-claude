import { ChatWindow } from "@/components/chatWindow"

export default async function Page(props) {
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