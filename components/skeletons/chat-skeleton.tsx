import { Skeleton } from "@/components/ui/skeleton"

const ChatSkeleton = () => {
  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <Skeleton className="h-8 w-56" />

      {/* Chat messages area */}
      <div className="flex-1 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="h-16 w-3/4 rounded-lg" />
            <Skeleton className="h-16 w-3/4 rounded-lg self-end" />
          </div>
        ))}
      </div>

      {/* Input area */}
      <div className="flex gap-2">
        <Skeleton className="h-12 flex-1 rounded-lg" />
        <Skeleton className="h-12 w-12 rounded-lg" />
      </div>
    </div>
  )
}

export default ChatSkeleton
