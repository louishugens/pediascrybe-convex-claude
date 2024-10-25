'use client'
import React, { useState } from 'react'
import { Button } from './ui/button'
import { deleteVaccine } from '@/app/actions'
import { X, Loader2 } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip"
import { toast } from 'sonner'

export function DeleteVaccinComponent({ vaccineId }: { vaccineId: string }) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const res = await deleteVaccine(vaccineId)
      if (res.success) {
        toast.success('Vaccine deleted successfully')
      } else {
        toast.error(res.error)
      }
    } catch (error) {
      console.error('Failed to delete vaccine:', error)
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
          <p>Delete Vaccine</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
