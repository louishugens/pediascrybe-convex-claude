"use client"

import { useParams } from "next/navigation"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Spinner } from "@/components/ui/spinner"
import { FileUploadPortal } from "@/components/portal/file-upload-portal"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { toast } from "sonner"
import {
  Upload,
  Image as ImageIcon,
  FileText,
  Trash2,
  ExternalLink,
} from "lucide-react"
import Link from "next/link"

export default function UploadsPage() {
  const params = useParams()
  const patientId = params.patientId as Id<"patients">

  const files = useQuery(api.portal.getPatientFiles, { patientId })
  const deleteFile = useMutation(api.portal.deletePatientFile)

  const handleDelete = async (fileId: Id<"patientFiles">) => {
    try {
      await deleteFile({ fileId })
      toast.success("File deleted")
    } catch (error: any) {
      toast.error(error.message || "Failed to delete file")
    }
  }

  if (files === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Uploads</h2>
        <p className="text-sm text-muted-foreground">
          Upload documents and images for your doctor
        </p>
      </div>

      {/* Upload Area */}
      <div className="rounded-xl border border-border/50 bg-card/50 p-5">
        <h3 className="font-semibold mb-3">Upload New File</h3>
        <FileUploadPortal patientId={patientId} />
      </div>

      {/* Files Grid */}
      {files.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Upload className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p>No files uploaded yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
            Uploaded Files ({files.length})
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {files.map((file) => (
              <div
                key={file._id}
                className="rounded-lg border border-border/50 bg-card/50 p-4 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    {file.fileType === "IMAGE" ? (
                      <ImageIcon className="h-5 w-5 text-primary shrink-0" />
                    ) : (
                      <FileText className="h-5 w-5 text-primary shrink-0" />
                    )}
                    <span className="text-sm font-medium truncate">{file.name}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Link href={file.url as any} target="_blank">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(file._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {file.description && (
                  <p className="text-xs text-muted-foreground">{file.description}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {format(new Date(file.createdAt), "MMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
