'use client'

import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import useDoctor from '@/utils/hooks/useDoctor';
import { useState } from "react";
import BeatLoader  from 'react-spinners/BeatLoader';
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from 'sonner'
import PulseLoader from "react-spinners/PulseLoader"
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
import { useCompletion } from '@ai-sdk/react';


const CreateReport = ({patientId, patient, consultations}) => {

  const [generating, setGenerating] = useState(false)



  const fetchReportSuggestions = async () => {

    const messages = [
      // {
      //   role: "system",
      //   content: `As ScrybeGPT, your task is to generate a medical report or certificate based on the patient's profile and past consultations. Follow these steps:
      
      //             1. Receive and understand the patient's profile, including age, gender, and any relevant medical history.
      //             2. Review the list of past consultations, focusing on the symptoms (motif), diagnosis, and treatments provided.
      //             3. Identify the language used most frequently in the consultation's motif data.
      //             4. Summarize the key medical information in a structured format using HTML tags:
      //                - Use <h1> to <h3> tags for headings.
      //                - Use <p> for paragraphs.
      //                - Use <ul> and <li> for lists.
      //             5. Translate the summary into the identified language, if it is different from the current language.
      //             6. Ensure the final report is well-structured, readable, and correctly formatted with HTML tags.
      
      //           The final medical report should be a comprehensive and concise summary of the patient's medical history and past consultations, presented in a professional and structured manner using HTML formatting.`
      // },
      {
        role: "system",
        content: `As ScrybeGPT, your task is to generate a medical ${reportType} or certificate based on the patient's profile and past consultations, and then output only the HTML-formatted section of the ${reportType}. Follow these steps:
      
                  1. Review the patient's profile and list of past consultations.
                  2. Summarize the key medical information, including patient details, consultation dates, symptoms, findings, and recommendations.
                  3. Format this summary using HTML tags for headings, paragraphs, and lists.
                  4. Identify the language used most frequently in the consultation motifs. If it's different from English, translate the summary into that language.
                  5. After creating the HTML-formatted ${reportType}, output only this section enclosed within HTML tags.
      
                Respond with just the body section of the HTML-formatted medical ${reportType} and ensure it's in the language most frequently identified in the consultation motifs.`
      },
      // {
      //   role: "user",
      //   content: `Patient Profile: [Patient Details]`
      // },
      // {
      //   role: "user",
      //   content: `Past Consultations: [List of Consultations]`
      // },

      
      // {
      //   role: "system",
      //   content:`As ScrybeGPT, a helpful medical assidtant, your task is to propose to pediatricians a medical ${reportType} or a medical certificate\
      //           You are given the patients profile and a list of consultations records and your job is to produce the ${reportType} based on these info\
      //           You will follow the steps below:\
      //           1- Identify the language used in consultation.motif\
      //           2- Generate the medical ${reportType} or medical certicitate from all the info received by summarizing all the data\
      //           3- Format the ${reportType} in HTML for styling heading, list and paragraph etc.., 
      //           4-  Tranlate it in the laguage identified in 1
      //           5- Send the ${reportType} text only to the pediatrician, no need to introduce the ${reportType}\
      //   `
      // },
      {
        role: "user",
        content: `The patient's information are ${JSON.stringify(patient)}`,
      },
      {
        role: "user",
        content: `The patient's consultations are ${JSON.stringify(consultations)}`,
      },
      {
        role: "user",
        content: `The report type is ${reportType}`, 
      },
      // {
      //   role: "system",
      //   content: `Submit the html body part of the ${reportType}  only in the proper format and language`
      // }
      {
        role: "system",
        content: `Translate the ${reportType} into the most frequently identified language from the consultation's motif data, and ensure proper HTML formatting.`
      },
      {
        role: "system",
        content: `Filter out everything except the HTML body section of the ${reportType}. The output should start with <body> and end with </body>.`
      }
    ]


    setGenerating(true)
    try {
      const response = await fetch('/api/ai/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({messages})
      })

      if (!response.ok) {
        throw new Error('Failed to generate report')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let content = ''

      if (!reader) {
        throw new Error('No reader available')
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        content += chunk

        // Update form as we receive chunks
        // Remove markdown code blocks and body tags
        const cleanContent = content
          .replace(/^```html\n?/i, '')
          .replace(/```$/g, '')
          .replace(/<\/?body>/g, '')
          .trim()
        // Ensure the content is wrapped in a paragraph if it's plain text
        const formattedContent = cleanContent.startsWith('<') ? cleanContent : `<p>${cleanContent}</p>`
        
        form.setValue('content', formattedContent, {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true
        })
      }
    } catch (error) {
      console.error('Error generating report:', error)
      toast.error('Failed to generate report')
    } finally {
      setGenerating(false)
    }
  }

  const schema = z.object({
    reportType: z.string({ error: (issue) => issue.input === undefined ? 
      "Please select report type" :
      "Not a string" 
      }),
    content:  z.string({ error: (issue) => issue.input === undefined ? 
      "Please enter report's content" :
      "Not a string" 
      }),
  })


  
  let [color, setColor] = useState("#ffffff")
  let [loading, setLoading] = useState(false)



  type FormValues = z.infer<typeof schema>

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const reportType = form.watch('reportType')



  const doctor = useDoctor()
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
      router.push(`/user/patients/${patientId}/reports/${report._id}`)

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
    <p className='text-lg text-primary font-bold mt-8'>Create Report or Cetificate or Reference Note</p>
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
                    <SelectItem value="ReferenceNote">Reference Note</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className=" mt-8">
       {
          reportType && 
            (
              generating
              ?
                <span className=' font-light text-primary flex flex-row gap-2'><span>ScrybeGPT thinking </span><PulseLoader className='my-auto' color={"#21C55D"} size={5} aria-label="Loading Spinner" data-testid="loader"/></span>
              :
                <span className=' font-light text-primary'>Generate with ScrybeGPT? <span className='px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs cursor-pointer'  onClick={fetchReportSuggestions}>Yes</span></span>
            )
          
        } 
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
 
export default CreateReport;