"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { z } from "zod"
import BeatLoader from "react-spinners/BeatLoader"
import PulseLoader from "react-spinners/PulseLoader"
import { refresh } from "@/app/actions"
import { generateDiagnosticPrompt } from "@/lib/prompts"
import { useCompletion } from '@ai-sdk/react'
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AppointmentSelect, PatientSelect } from "@/db/schema"

const formSchema = z.object({
  height: z.coerce.number().min(0, "Height can't be less than 0").nullable().optional(),
  weight: z.coerce.number().min(0, "Weight can't be less than 0").nullable().optional(),
  head: z.coerce.number().min(0, "Head circumference can't be less than 0").nullable().optional(),
  arm: z.coerce.number().min(0, "Arm circumference can't be less than 0").nullable().optional(),
  sao2: z.coerce
    .number()
    .min(0, "SaO2 percentage can't be less than 0")
    .max(100, "SaO2 percentage can't be more than 100")
    .nullable()
    .optional(),
  temperature: z.coerce.number().nullable().optional(),
  pulse: z.coerce.number().min(0, "Pulse can't be less than 0").nullable().optional(),
  respiratory: z.coerce.number().min(0, "Respiratory rate can't be less than 0").nullable().optional(),
  systolic: z.coerce.number().min(0, "Systolic blood pressure can't be less than 0").nullable().optional(),
  diastolic: z.coerce.number().min(0, "Diastolic blood pressure can't be less than 0").nullable().optional(),
  motif: z.string().optional(),
  findings: z.string().optional(),
  otherRemarks: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface AddAppointmentProps {
  doctorId: string
  patientId: string
  patient: any
}

const AddAppointment = ({ doctorId, patientId, patient }: AddAppointmentProps) => {
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [suggestions, setSuggestions] = useState("")
  const [thinking, setThinking] = useState(false)
  
  const { complete, completion, isLoading } = useCompletion({
    api: "/api/ai/diagnostic",
  })
  const router = useRouter()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      height: undefined,
      weight: undefined,
      head: undefined,
      motif: "",
      findings: suggestions || "",
      arm: undefined,
      sao2: undefined,
      pulse: undefined,
      respiratory: undefined,
      systolic: undefined,
      diastolic: undefined,
      temperature: undefined,
      otherRemarks: "",
    },
  })

  const symptoms = form.watch("motif")
  const height = form.watch("height")
  const weight = form.watch("weight")
  const head = form.watch("head")
  const arm = form.watch("arm")
  const sao2 = form.watch("sao2")
  const temperature = form.watch("temperature")
  const pulse = form.watch("pulse")
  const respiratory = form.watch("respiratory")
  const systolic = form.watch("systolic")
  const diastolic = form.watch("diastolic")

  useEffect(() => {
    if (!symptoms) {
      setThinking(false)
    }
    const timeoutId = setTimeout(() => {
      if (symptoms) {
        setThinking(true)
      }
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [symptoms])

  const fetchDiagnosticSuggestions = async (patient: PatientSelect, appointment: Partial<AppointmentSelect>) => {
    if (symptoms) {
      setGenerating(true)
      
      const { firstname, lastname, email, mothername, ...patientWithoutIdentity} = patient

      const body = `The patient's information is ${JSON.stringify(patientWithoutIdentity)}. The consultation information is ${JSON.stringify(appointment)}.`
      
      await complete(body)
      setGenerating(false)
    }
  }

  useEffect(() => {
    if (completion) {
      setSuggestions(completion);
      form.setValue("findings", completion);
    }
  }, [completion, form]);

  const {appointments, ...patientWithoutAppointments} = patient

  const onSubmit = async (values: FormValues) => {
    setLoading(true)
    try {
      const body = {
        ...values,
        patientId,
        doctorId,
      }

      const response = await fetch("/api/patients/addAppointment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const appointment = await response.json()
      console.log("appointment :>> ", appointment)

      refresh([`/user/patients/${patientId}`])
      router.push(`/user/patients/${patientId}/${appointment.id}`)
    } catch (err) {
      console.log(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="py-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-green-600 font-bold">New Consultation</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Vital Signs Grid */}
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                <FormField
                  control={form.control}
                  name="height"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Height (cm)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Patient's height in cm"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight (kg)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Patient's weight in kg"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="head"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Head Circumference (cm)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Patient's head circumference in cm"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="arm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Arm Circumference (cm)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Patient's arm circumference in cm"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sao2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SaO2 (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Patient's SaO2 in percentage"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="temperature"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Temperature (°C)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Patient's temperature in °C"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pulse"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pulse (bpm)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="1"
                          placeholder="Patient's pulse in bpm"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="respiratory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Respiratory Rate (rpm)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="1"
                          placeholder="Patient's respiratory rate in rpm"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="systolic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Systolic BP (mmHg)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="1"
                          placeholder="Patient's systolic blood pressure in mmHg"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="diastolic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Diastolic BP (mmHg)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="1"
                          placeholder="Patient's diastolic blood pressure in mmHg"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Clinical Notes Grid */}
              <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                <FormField
                  control={form.control}
                  name="motif"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Signs and Symptoms</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="How does the patient feel?"
                          className="min-h-[120px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="findings"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center">
                        <FormLabel>Diagnostic</FormLabel>
                        {thinking &&
                          symptoms &&
                          (generating ? (
                            <span className="font-light text-green-600 flex items-center gap-2">
                              <span className="text-sm">ScrybeGPT thinking</span>
                              <PulseLoader color="#16a34a" size={5} aria-label="Loading Spinner" />
                            </span>
                          ) : (
                            <span className="font-light text-green-600 text-sm">
                              Generate with ScrybeGPT?{" "}
                              <Button
                                type="button"
                                size="sm"
                                className="ml-2 bg-green-600 hover:bg-green-700 py-1 px-3 text-xs h-auto"
                                onClick={() => fetchDiagnosticSuggestions(patientWithoutAppointments, {
                                  motif: symptoms,
                                  height: height,
                                  weight: weight,
                                  head: head,
                                  arm: arm,
                                  sao2: sao2,
                                  pulse: pulse,
                                  respiratory: respiratory,
                                  systolic: systolic,
                                  diastolic: diastolic,
                                  temperature: temperature,
                                })}
                              >
                                Yes
                              </Button>
                            </span>
                          ))}
                      </div>
                      <FormControl>
                        <Textarea
                          placeholder="What do you believe the patient is suffering from?"
                          className="min-h-[120px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="otherRemarks"
                  render={({ field }) => (
                    <FormItem className="lg:col-span-2">
                      <FormLabel>Other Remarks</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any other remarks about the patient?"
                          className="min-h-[120px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-center pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full max-w-md bg-green-600 hover:bg-green-700 text-lg font-semibold py-3 rounded-full"
                >
                  {loading ? <BeatLoader color="#ffffff" size={10} aria-label="Loading Spinner" /> : "Add Appointment"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

export default AddAppointment
