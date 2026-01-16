'use client'

import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import useDoctor from '@/utils/hooks/useDoctor';
import { useState } from "react";
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from 'sonner'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Editor } from '@/components/editor';
import { refresh } from '@/app/actions';
import { Id, Doc } from '@/convex/_generated/dataModel';
import { useSubscriptionGuard } from '@/hooks/use-subscription-guard';
import { useAIQueryAccess } from '@/components/subscription-guard';
import { UpgradeModal } from '@/components/upgrade-modal';
import { ViewTransition } from 'react';
import { Spinner } from '@/components/ui/spinner'

interface EditReportProps {
  patientId: Id<"patients">;
  report: Doc<"reports">;
  patient: Doc<"patients">;
  records: Doc<"appointments">[];
}

const EditReport = ({patientId, report, patient, records}: EditReportProps) => {
  const [generating, setGenerating] = useState(false)
  const [loading, setLoading] = useState(false)
  const [id, setId] = useState(report._id)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  
  // Check for ai_report feature access
  const { isAllowed: canUseAIReport, reason: aiBlockReason, isLoading: checkingAccess } = useAIQueryAccess('ai_report');

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

  type FormValues = z.infer<typeof schema>

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues:{
      reportType: report.reportType,
      content: report.content ?? undefined
    }
  })

  const reportType = form.watch('reportType')

  const doctor = useDoctor()
  const router = useRouter()
  const { requireSubscription } = useSubscriptionGuard()

  const fetchReportSuggestions = async () => {
    // Check if user can use AI Report feature
    if (!canUseAIReport) {
      setShowUpgradeModal(true);
      return;
    }

    // Calculate age from birthdate with granularity for infants
    const birthDate = new Date(patient.birthdate);
    const today = new Date();
    const diffMs = today.getTime() - birthDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    let age: string;
    if (diffDays < 7) {
      age = `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      age = `${weeks} week${weeks !== 1 ? 's' : ''}`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      age = `${months} month${months !== 1 ? 's' : ''}`;
    } else {
      const years = Math.floor(diffDays / 365);
      age = `${years} year${years !== 1 ? 's' : ''}`;
    }

    // Format patient info with readable birthdate and calculated age
    const patientInfo = {
      ...patient,
      birthdate: birthDate.toLocaleDateString(),
      age: age,
    };

    const messages = [
      {
        role: "system",
        content: `As ScrybeGPT, your task is to generate a medical ${reportType} or certificate based on the patient's profile and past records, and then output only the HTML-formatted section of the ${reportType}. Follow these steps:
      
                  1. Review the patient's profile and list of past records.
                  2. Summarize the key medical information, including patient details, record dates, symptoms, findings, and recommendations.
                  3. Format this summary using HTML tags for headings, paragraphs, and lists.
                  4. Identify the language used most frequently in the record motifs. If it's different from English, translate the summary into that language.
                  5. After creating the HTML-formatted ${reportType}, output only this section enclosed within HTML tags.
      
                Respond with just the body section of the HTML-formatted medical ${reportType} and ensure it's in the language most frequently identified in the record motifs.`
      },
      {
        role: "user",
        content: `The patient's information are ${JSON.stringify(patientInfo)}`,
      },
      {
        role: "user",
        content: `The patient's records are ${JSON.stringify(records)}`,
      },
      {
        role: "user",
        content: `The report type is ${reportType}`, 
      },
      {
        role: "system",
        content: `Translate the ${reportType} into the most frequently identified language from the record's motif data, and ensure proper HTML formatting.`
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

  const onSubmit = async (values: FormValues) => {
    // Check subscription before proceeding
    if (!requireSubscription("update reports")) return;
    
    setLoading(true)
 
    try{
      const {reportType, content} = values
      const body = {reportType, content, patientId, id}
      const res = await fetch(`/api/patients/edit-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const report = await res.json()
      setLoading(false)

      refresh([`/user/patients/${patientId}/reports/${id}`, `/user/patients/${patientId}/reports/${id}/edit-report`, `/user/patients/${patientId}/reports/`])
      router.push(`/user/patients/${patientId}/reports/${report._id}`)

    }
    catch(err){
      console.log(err)
      setLoading(false)
      toast.error('Something went wrong. Please try again later')
    }
  }

  return ( 
  <div className="flex flex-col w-full items-start">
    <p className='text-lg text-primary font-bold my-4'>Edit Report or Certificate or Reference Note</p>
    <ViewTransition>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex bg-muted rounded-md p-4 flex-col w-full text-sm">
          <div className="grid gap-x-8 gap-y-8 grid-cols-2">
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
          <div>
        {
            reportType && 
              (
                generating
                ?
                  <span className=' font-light text-primary flex flex-row gap-2 items-center justify-start'><span>ScrybeGPT thinking </span><Spinner aria-label="Loading Spinner" data-testid="loader"/></span>
                :
                  <span className=' font-light text-primary'>Regenerate with ScrybeGPT? <span className='px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs cursor-pointer'  onClick={fetchReportSuggestions}>Yes</span></span>
              )
            
          } 
          </div>
          <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem className='mt-4'>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Editor 
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}  
            />
          <button className="py-2 px-4 rounded-full bg-primary text-primary-foreground text-lg font-semibold w-1/2 center mt-8 mx-auto" type='submit'>
            {
              loading
              ?
              <span className='flex flex-row gap-2 items-center justify-center'><span>Saving report </span><Spinner aria-label="Loading Spinner" data-testid="loader"/></span>
              :
                "Save report"
            }
          </button>
        </form>
      </Form>
    </ViewTransition>

    {/* Upgrade Modal for Feature Locked */}
    <UpgradeModal
      open={showUpgradeModal}
      onOpenChange={setShowUpgradeModal}
      reason="feature_locked"
      featureName="AI Report Generation"
    />
  </div>
   );
}
 
export default EditReport;
