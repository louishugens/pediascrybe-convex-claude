import prisma from "@/utils/prisma"
import { ChatWindow } from "@/components/chatWindow"

export default function Page({params: { patientId }}) {
  return (
    <ChatWindow 
      endpoint={`/api/chat/${patientId}/`}
      emptyStateComponent={<div className="grow"></div>}
    
    />
  )
}
