'use client'
import React, { useState } from 'react'
import { Button } from './ui/button'
import { deleteService } from '@/app/actions'
import { X, Loader2 } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip"
import { toast } from 'sonner'

export function DeleteServiceComponent({ serviceId }: { serviceId: string }) {
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    setIsDeleting(true)
    try {
      const res = await deleteService(serviceId)
      if (res.success) {
        toast.success('Service deleted successfully')
      } else {
        toast.error(res.error)
      }
    } catch (error) {
      console.error('Failed to delete service:', error)
      toast.error('Failed to delete service')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="destructive"
            size="icon"
            className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <X className="h-3 w-3" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>Delete Service</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

