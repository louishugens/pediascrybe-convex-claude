import { ChatWindow } from "@/components/chatWindow"

export default function Page({params: { patientId }}) {
  return (
    <div className="flex flex-col h-full py-8">
      <ChatWindow 
        endpoint={`/api/chat/${patientId}/`}
        emptyStateComponent={<div className="grow"></div>}
      />
    </div>
  )
}