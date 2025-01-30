'use client'

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast';
import { BeatLoader } from "react-spinners"

 
// import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import FileUpoad from "@/components/fileUpload"
import { el } from "date-fns/locale"
import { revalidatePath } from "next/cache"
import { refresh } from "@/app/actions"

export default function UploadPage({params: {patientId, appointmentId}}) {

  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const schema = z.object({
    url: z.string({ required_error: "Please upload a file" }),
    name: z.string({ required_error: "Please enter a name for the file" }),
  })

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: z.infer<typeof schema>) {
    setLoading(true)
    const extension = data.url?.split('.').pop()?.toLowerCase() ?? ''
    const videoFormats = ['mp4', 'mov', 'avi', 'wmv', 'flv']
    const isVideo = videoFormats.includes(extension)
    const fileType = isVideo ? 'VIDEO' : 
                    extension === 'pdf' ? 'PDF' : 'IMAGE'
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
      if(file){
        toast.success("File saved!", {
          icon: '👏',
        })
        // router.refresh()
        // revalidatePath(`/user/patients/${patientId}/${appointmentId}/`)
        refresh([`/user/patients/${patientId}/${appointmentId}`])
        router.push(`/user/patients/${patientId}/${appointmentId}/`)
        // setLoading(false)
      }else{
        toast.error("Something went wrong!", {
          icon: '😢',
        })
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
      <Toaster />
    </div>
  )
}
