"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { z } from "zod"
import { Spinner } from "@/components/ui/spinner"
import { refresh } from "@/app/actions"
import { useCompletion } from '@ai-sdk/react'
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { Id } from "@/convex/_generated/dataModel"
import { useSubscriptionGuard } from "@/hooks/use-subscription-guard"

interface Service {
  _id: Id<"services">;
  name: string;
  price: number;
  currency: string;
}




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
  internalNotes: z.string().optional(),
  serviceId: z.string().optional(),
  cost: z.coerce.number().min(0, "Cost can't be less than 0").nullable().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface EditAppointmentProps {
  appointment: any
  patientId: string
  patient: any
  services: Service[]
}

const EditAppointment = ({ appointment, patientId, patient, services }: EditAppointmentProps) => {
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [suggestions, setSuggestions] = useState<string | null>(null)
  const [thinking, setThinking] = useState(false)

  const router = useRouter()
  const { requireSubscription } = useSubscriptionGuard()

  const { complete, completion, isLoading } = useCompletion({
    api: '/api/ai/diagnostic',
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      height: appointment.height || undefined,
      weight: appointment.weight || undefined,
      head: appointment.head || undefined,
      motif: appointment.motif || "",
      findings: appointment.findings || "",
      otherRemarks: appointment.otherRemarks || "",
      internalNotes: appointment.internalNotes || "",
      arm: appointment.arm || undefined,
      sao2: appointment.sao2 || undefined,
      temperature: appointment.temperature || undefined,
      pulse: appointment.pulse || undefined,
      respiratory: appointment.respiratory || undefined,
      systolic: appointment.systolic || undefined,
      diastolic: appointment.diastolic || undefined,
      serviceId: appointment.serviceId || undefined,
      cost: appointment.cost || undefined,
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
  const serviceId = form.watch("serviceId")
  const cost = form.watch("cost")

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

  const fetchDiagnosticSuggestions = async (patient: any, appointment: any) => {
    // Check subscription before AI generation
    if (!requireSubscription("generate AI diagnostics")) return;
    
    if (symptoms) {
      setGenerating(true)

      const { firstname, lastname, email, mothername, ...patientWithoutIdentity } = patient

      const body = `The patient's information is ${JSON.stringify(patientWithoutIdentity)}. The record information is ${JSON.stringify(appointment)}.`

      await complete(body)
      setGenerating(false)
    }
  }

  // Update findings when completion is received
  useEffect(() => {
    if (completion) {
      setSuggestions(completion);
      form.setValue("findings", completion);
    }
  }, [completion, form]);

  const { appointments, ...patientWithoutAppointments } = patient

  const onSubmit = async (values: FormValues) => {
    // Check subscription before proceeding
    if (!requireSubscription("update records")) return;
    
    setLoading(true)
    try {
      const body = {
        ...values,
        appointmentId: appointment._id,
      }

      await fetch("/api/patients/updateAppointment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      refresh([
        `/user/patients/${appointment.patientId}/`,
        `/user/patients/${appointment.patientId}/${appointment._id}`,
        `/user/patients/${appointment.patientId}/${appointment._id}/edit-appointment`,
      ])

      router.push(`/user/patients/${patientId}/${appointment._id}`)
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
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl text-primary font-bold">Update Record</CardTitle>
            <Button variant="outline" size="icon" asChild>
              <Link href={`/user/patients/${patientId}`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Record Type (Service) Selection */}
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="serviceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Record Type</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          const selectedService = services.find((s) => s._id === value);
                          if (selectedService) {
                            form.setValue("cost", selectedService.price);
                          }
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a service" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {services.map((service) => (
                            <SelectItem key={service._id} value={service._id}>
                              {service.name} - {service.price} {service.currency}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Price</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Service price"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
                          placeholder="Patient's SaO2 in %"
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
                          placeholder="Systolic blood pressure"
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
                          placeholder="Diastolic blood pressure"
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
                      <div className="h-[17px] flex items-center">
                        <FormLabel>Signs and Symptoms</FormLabel>
                      </div>
                      <FormControl>
                        <Textarea
                          placeholder="How does the patient feel?"
                          className="h-[120px] resize-none overflow-y-auto"
                          {...field}
                        />
                      </FormControl>
                      {patient.portalEnabled && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Eye className="h-3 w-3" />
                          Visible on portal
                        </span>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="findings"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center h-[17px]">
                        <FormLabel>Diagnostic</FormLabel>
                        {thinking &&
                          symptoms &&
                          (isLoading ? (
                            <span className="font-light text-primary flex items-center gap-2">
                              <span className="text-sm">ScrybeGPT thinking</span>
                              <Spinner aria-label="Loading Spinner" data-testid="loader" />
                            </span>
                          ) : (
                            <span className="font-light text-primary text-sm">
                              Generate with ScrybeGPT?{" "}
                              <Button
                                type="button"
                                size="sm"
                                className="ml-2 py-0.5 px-3 text-xs h-auto"
                                onClick={() => fetchDiagnosticSuggestions(patientWithoutAppointments, {
                                  motif: symptoms,
                                  height: height || null,
                                  weight: weight || null,
                                  head: head || null,
                                  arm: arm || null,
                                  sao2: sao2 || null,
                                  temperature: temperature || null,
                                  pulse: pulse || null,
                                  respiratory: respiratory || null,
                                  systolic: systolic || null,
                                  diastolic: diastolic || null,
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
                          className="h-[120px] resize-none overflow-y-auto"
                          value={completion || field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      {patient.portalEnabled && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Eye className="h-3 w-3" />
                          Visible on portal
                        </span>
                      )}
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
                          className="h-[120px] resize-none overflow-y-auto"
                          {...field}
                        />
                      </FormControl>
                      {patient.portalEnabled && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Eye className="h-3 w-3" />
                          Visible on portal
                        </span>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Internal Notes — Private */}
              <FormField
                control={form.control}
                name="internalNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Internal Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Private notes (not visible to parents on the portal)"
                        className="h-[120px] resize-none overflow-y-auto border-dashed"
                        {...field}
                      />
                    </FormControl>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <EyeOff className="h-3 w-3" />
                      Private — not visible on portal
                    </span>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-center pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full max-w-md text-lg font-semibold py-3 rounded-full"
                >
                  {loading ? (
                    <span className="flex items-center gap-2"><span>Saving record</span><Spinner aria-label="Loading Spinner" /></span>
                  ) : (
                    "Update Record"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

export default EditAppointment
