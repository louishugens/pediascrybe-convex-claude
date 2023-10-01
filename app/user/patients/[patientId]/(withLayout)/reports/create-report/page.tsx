'use client'

import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import useDoctor from '@/utils/hooks/useDoctor';
import { useState } from "react";
import BeatLoader  from 'react-spinners/BeatLoader';
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Toaster, toast } from 'sonner'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import EditDoctor from '@/components/editDoctor';
import { Editor } from '@/components/editor';


const CreateReportPage = ({params:{patientId}}) => {
  const schema = z.object({
    reportType: z.string({ required_error: "Please select report type" }),
    content:  z.string({ required_error: "Please enter report's content" }),
  })


  
  let [color, setColor] = useState("#ffffff")
  let [loading, setLoading] = useState(false)



  type FormValues = z.infer<typeof schema>

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  type Doctor = {
    id: string
  }


  const doctor: Doctor | null = useDoctor()
  const router = useRouter()


  const onSubmit = async (values: FormValues) => {
    setLoading(true)
 
    try{
      const {reportType, content} = values
      const body = {reportType, content, patientId}
      const res = await fetch('/api/patients/create-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const report = await res.json()

      router.refresh()
      router.push(`/user/patients/${patientId}/reports/${report.id}`)

    }
    catch(err){
      console.log(err)
      setLoading(false)
      toast.error('Something went wrong. Please try again later')
    }
    // router.push(`/user/patients`)
  }


  return ( 
  <div className="flex flex-col w-full items-center">
    <Toaster richColors position="top-center" />
    <p className='text-lg text-primary font-bold mt-8'>Create Report or Cetificate</p>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex bg-muted rounded-md p-8 flex-col mt-8 w-2/3 text-sm">
        <div className="grid gap-x-8 gap-y-8 grid-cols-2 mt-4">
          <FormField
            control={form.control}
            name='reportType'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select the report's type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Report">Report</SelectItem>
                    <SelectItem value="Certificate">Certificate</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

        </div>
        <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem className='mt-8'>
                <FormLabel>Content</FormLabel>
                <FormControl>
                  {/* <Textarea placeholder="Medical history" {...field} /> */}
                  <Editor 
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}  
          />
        <button className="py-2 px-4 rounded-full bg-green-500 text-lg font-semibold w-1/2 center mt-8 mx-auto" type='submit'>
          {
              loading
              ?
              <BeatLoader
                color={color}
                size={10}
                aria-label="Loading Spinner"
                data-testid="loader"
              />
              :
                "Create report"
          }
        </button>
      </form>
    </Form>
  </div>
   );
}
 
export default CreateReportPage;