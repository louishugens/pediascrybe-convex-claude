'use client'

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useRouter } from 'next/navigation'
import { toast } from 'sonner';
import { BeatLoader } from "react-spinners"

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import FileUpoad from "@/components/fileUpload"
import { refresh } from "@/app/actions"

interface UploadFormProps {
  patientId: string;
  appointmentId: string;
}

export default function UploadForm({ patientId, appointmentId }: UploadFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fileMeta, setFileMeta] = useState<{ name: string; type: string } | null>(null)

  const schema = z.object({
    url: z.string({
      error: (issue) => issue.input === undefined ?
        "Please upload a file" :
        "Not a string"
    }),
    name: z.string({
      error: (issue) => issue.input === undefined ?
        "Please enter a name for the file" :
        "Not a string"
    }),
  })

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: z.infer<typeof schema>) {
    setLoading(true)
    // v7 upload URLs have no extension — use the uploaded file's MIME type
    // (with the original filename's extension as a fallback).
    const mime = fileMeta?.type ?? ''
    const extension = (fileMeta?.name ?? data.url)?.split('.').pop()?.toLowerCase() ?? ''
    const videoFormats = ['mp4', 'mov', 'avi', 'wmv', 'flv', 'webm']
    const isVideo = mime.startsWith('video/') || videoFormats.includes(extension)
    const fileType = isVideo ? 'VIDEO' :
      (mime === 'application/pdf' || extension === 'pdf') ? 'PDF' : 'IMAGE'
    const { url, name } = data

    const res = await fetch(`/api/patients/saveFile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        name,
        fileType,
        appointmentId,
        patientId
      }),
    })
    const file = await res.json()
    if (file) {
      toast.success("File saved! 👏")
      refresh([`/user/patients/${patientId}/${appointmentId}`])
      router.push(`/user/patients/${patientId}/${appointmentId}/`)
      // Reset transient state so a cached/preserved instance of this page
      // (Next keeps route segments in the client router cache) doesn't show the
      // previous upload's preview, filename, or a stuck loading spinner next
      // time. Reset to "" (not undefined) so the controlled name input clears.
      form.reset({ url: "", name: "" })
      setFileMeta(null)
      setLoading(false)
    } else {
      toast.error("Something went wrong! 😢")
      setLoading(false)
    }

  }

  return (
    <div className="w-full h-[20rem] flex flex-col items-center justify-center p-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-2/3 h-full">
          <h3 className="text-2xl font-bold mb-4 text-center">Upload a file</h3>
          <p className="text-center text-muted-foreground mb-4">
            Supported formats: PDF, Images, Videos (MP4, MOV, AVI, WMV, FLV) • Max size: 4MB
          </p>
          <FormField
            name="url"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <FileUpoad
                    endpoint="appointmentFile"
                    value={field.value}
                    onChange={field.onChange}
                    onUpload={(meta) => {
                      setFileMeta(meta)
                      if (!form.getValues('name')) {
                        // Prefill with the original filename minus its extension.
                        const nameNoExt = meta.name.replace(/\.[^/.]+$/, '')
                        form.setValue('name', nameNoExt, { shouldValidate: true })
                      }
                    }}
                  />
                </FormControl>
                <FormMessage>{form.formState.errors.url?.message}</FormMessage>
              </FormItem>
            )}
          />
          <FormField
            name="name"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="pt-4">File Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Name"
                    {...field}
                  />
                </FormControl>
                <FormMessage>{form.formState.errors.name?.message}</FormMessage>
              </FormItem>
            )}
          />
          <div className="flex flex-col items-center">
            <button type="submit" className="mt-4 px-4 py-2 bg-primary rounded-full text-muted text-sm">
              {
                loading
                  ?
                  <BeatLoader
                    color={"#fff"}
                    size={10}
                    aria-label="Loading Spinner"
                    data-testid="loader"
                  />
                  :
                  "Save"
              }
            </button>
          </div>
        </form>
      </Form>
    </div>
  )
}
