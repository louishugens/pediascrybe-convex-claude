"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import { Upload, X, Image as ImageIcon, FileText } from "lucide-react"

interface FileUploadPortalProps {
  patientId: Id<"patients">
  onUploadComplete?: () => void
}

export function FileUploadPortal({ patientId, onUploadComplete }: FileUploadPortalProps) {
  const [uploading, setUploading] = useState(false)
  const [description, setDescription] = useState("")
  const uploadFile = useMutation(api.portal.uploadPatientFile)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const isImage = file.type.startsWith("image/")
    const isPdf = file.type === "application/pdf"
    if (!isImage && !isPdf) {
      toast.error("Only images and PDF files are supported")
      return
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB")
      return
    }

    setUploading(true)
    try {
      // For now, we'll use a data URL approach
      // In production, this would integrate with uploadthing or similar
      const reader = new FileReader()
      reader.onload = async () => {
        const url = reader.result as string

        await uploadFile({
          patientId,
          url,
          name: file.name,
          fileType: isImage ? "IMAGE" : "PDF",
          description: description || undefined,
        })

        toast.success("File uploaded successfully")
        setDescription("")
        onUploadComplete?.()
      }
      reader.readAsDataURL(file)
    } catch (error: any) {
      toast.error(error.message || "Failed to upload file")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <label className="text-sm font-medium">Description (optional)</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., Symptom photo, Lab results..."
          className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
        />
      </div>

      <label className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer">
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />
        {uploading ? (
          <Spinner />
        ) : (
          <>
            <Upload className="h-8 w-8 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm font-medium">Click to upload</p>
              <p className="text-xs text-muted-foreground">Images or PDF files, max 10MB</p>
            </div>
          </>
        )}
      </label>
    </div>
  )
}
