import prisma from "@/utils/prisma"
import { ChatWindow } from "@/components/chatWindow"

export default async function Page(props) {
  const params = await props.params;

  const {
    patientId
  } = params;

  return (
    <ChatWindow 
      endpoint={`/api/chat/${patientId}/`}
      emptyStateComponent={<div className="grow"></div>}
    />
  )
}
