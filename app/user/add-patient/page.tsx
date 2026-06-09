'use client'
import Link from 'next/link'
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import useDoctor from '@/utils/hooks/useDoctor';
import { useEffect, useState } from "react";
import BeatLoader from 'react-spinners/BeatLoader';
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { CalendarIcon, ArrowLeft, WifiOff } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
  Form,
  FormControl,
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
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useNetworkStatus } from "@/lib/offline/hooks/useNetworkStatus"
import { useOfflineRoute } from "@/lib/offline/context/OfflineRouteContext"
import { offlineDb } from "@/lib/offline/db"
import type { CachedDoctor } from "@/lib/offline/types"

const AddPatient = () => {

  const schema = z.object({
    firstname: z.string().min(1, { error: (issue) => issue.input === undefined ? 
      "Please enter patient's first name" :
      "Not a string" 
      }),
    lastname:  z.string().min(1, { error: (issue) => issue.input === undefined ? 
      "Please enter patient's last name" :
      "Not a string" 
      }),
    email: z.string().optional(),
    birthdate: z.date({error: (issue) => issue.input === undefined ?
      "Please enter patient's birth date" :
      "Not a date"
      }),
    birthWeight: z.number().positive("Birth weight must be positive").max(10, "Birth weight looks too high (enter kg, e.g. 3.2)").optional(),
    mothername: z.string().optional(),
    sex: z.enum(["male", "female"], {error: (issue) => issue.input === undefined ? 
      "Please enter patient's sex" :
      "Not a valid sex" 
      }),
    religion: z.string().optional(),
    phone: z.string().optional(),
    allergies: z.string().optional(),
    history: z.string().optional(),
    bloodtype: z.string().optional(),
    electrophoresis: z.string().optional(),
  })

  const [loading, setLoading] = useState(false)
  const [cachedDoctor, setCachedDoctor] = useState<CachedDoctor | null>(null)

  type FormValues = z.infer<typeof schema>

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstname: "",
      lastname: "",
      email: "",
      mothername: "",
      phone: "",
      religion: "",
      allergies: "",
      history: "",
      electrophoresis: "",
    },
  })

  const doctor = useDoctor()
  const router = useRouter()
  const { isOnline } = useNetworkStatus()
  const offlineCtx = useOfflineRoute()

  // Load cached doctor when offline
  useEffect(() => {
    if (!isOnline && !doctor) {
      offlineDb.doctors
        .toArray()
        .then((docs) => setCachedDoctor(docs[0] ?? null))
        .catch(() => setCachedDoctor(null))
    }
  }, [isOnline, doctor])

  const effectiveDoctor = doctor || cachedDoctor


  // Helper: save the patient to IndexedDB + queue for sync
  const savePatientOffline = async (values: FormValues) => {
    const { firstname, lastname, email, birthdate, birthWeight, mothername, sex, religion, phone, allergies, history, bloodtype, electrophoresis } = values
    // birthWeight is entered in kg but stored in grams
    const birthWeightGrams = typeof birthWeight === "number" ? Math.round(birthWeight * 1000) : undefined
    if (!effectiveDoctor) {
      toast.error("Doctor profile not available offline. Please try again when connected.")
      return
    }

    const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const now = Date.now()

    const patientDoc = {
      _id: tempId,
      doctorId: effectiveDoctor._id,
      firstname,
      lastname,
      email: email || undefined,
      phone: phone || undefined,
      birthdate: birthdate.getTime(),
      birthWeight: birthWeightGrams,
      sex: sex as "male" | "female",
      mothername: mothername || undefined,
      religion: religion || undefined,
      allergies: allergies || undefined,
      history: history || undefined,
      bloodtype: bloodtype || undefined,
      electrophoresis: electrophoresis || undefined,
      isCompleted: true,
      createdAt: now,
      updatedAt: now,
      _cachedAt: now,
    }

    await offlineDb.patients.put(patientDoc as any)

    await offlineDb.syncQueue.add({
      apiRoute: '/api/patients/addPatient',
      method: 'POST',
      payload: {
        firstname, lastname, email, birthdate, birthWeight: birthWeightGrams,
        mothername, sex, religion, phone,
        doctorId: effectiveDoctor._id,
        allergies, history, bloodtype, electrophoresis,
      },
      status: 'pending',
      retryCount: 0,
      maxRetries: 3,
      entityType: 'patient',
      entityId: tempId,
      createdAt: now,
    })

    toast.info("Patient saved offline. Will sync when back online.")

    if (offlineCtx) {
      offlineCtx.navigate(`/user/patients/${tempId}`)
    }
  }

  const onSubmit = async (values: FormValues) => {
    // If clearly offline, go straight to offline path
    if (!isOnline || !navigator.onLine) {
      setLoading(true)
      try {
        await savePatientOffline(values)
      } catch (err) {
        console.error(err)
        toast.error("Failed to save patient offline.")
      } finally {
        setLoading(false)
      }
      return
    }

    setLoading(true)

    try {
      const { firstname, lastname, email, birthdate, birthWeight, mothername, sex, religion, phone, allergies, history, bloodtype, electrophoresis } = values
      // birthWeight is entered in kg but stored in grams
      const birthWeightGrams = typeof birthWeight === "number" ? Math.round(birthWeight * 1000) : undefined
      const body = { firstname, lastname, email, birthdate, birthWeight: birthWeightGrams, mothername, sex, religion, phone, doctorId: doctor!._id, allergies, history, bloodtype, electrophoresis }

      const response = await fetch('/api/patients/addPatient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (!response.ok) throw new Error('Server error')

      const patient = await response.json()
      router.push(`/user/patients/${patient}`)
    } catch (err) {
      // Network failure while supposedly online — fall back to offline save
      console.warn('Online save failed, falling back to offline:', err)
      try {
        await savePatientOffline(values)
      } catch (offlineErr) {
        console.error(offlineErr)
        toast.error("Failed to add patient. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="py-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <CardTitle className="text-xl text-primary font-bold">Add New Patient</CardTitle>
              {!isOnline && (
                <Badge variant="outline" className="text-xs gap-1 text-amber-600 border-amber-300">
                  <WifiOff className="h-3 w-3" /> Offline
                </Badge>
              )}
            </div>
            <Button variant="outline" size="icon" asChild>
              <Link href="/user/patients">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="firstname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="mothername"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mother&apos;s Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Jane Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+50937000000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="jdoe@gmail.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='sex'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sex</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select the patient's sex" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">male</SelectItem>
                          <SelectItem value="female">female</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="religion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Religion</FormLabel>
                      <FormControl>
                        <Input placeholder="Catholic" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="birthdate"
                  render={({ field }) => (
                    <FormItem className='flex flex-col gap-y-1'>
                      <FormLabel>Birth Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            captionLayout="dropdown"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            startMonth={new Date(1900, 0)}
                            endMonth={new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="birthWeight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Birth Weight (kg)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          inputMode="decimal"
                          min={0}
                          step="any"
                          placeholder="e.g. 3.2"
                          value={field.value ?? ""}
                          onChange={(e) => {
                            const n = e.target.valueAsNumber;
                            field.onChange(e.target.value === "" || Number.isNaN(n) ? undefined : n);
                          }}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="allergies"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Allergies</FormLabel>
                      <FormControl>
                        <Input placeholder="Allergies" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bloodtype"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Blood Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select the patient's blood type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="A+">A+</SelectItem>
                          <SelectItem value="A-">A-</SelectItem>
                          <SelectItem value="B+">B+</SelectItem>
                          <SelectItem value="B-">B-</SelectItem>
                          <SelectItem value="AB+">AB+</SelectItem>
                          <SelectItem value="AB-">AB-</SelectItem>
                          <SelectItem value="O+">O+</SelectItem>
                          <SelectItem value="O-">O-</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="electrophoresis"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Electrophoresis</FormLabel>
                      <FormControl>
                        <Input placeholder="Electrophoresis" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="history"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>History</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Medical history" 
                          className="min-h-[120px] resize-none"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}  
                />

                <div className="flex justify-center pt-4 md:col-span-2">
                  <Button
                    type="submit"
                    disabled={loading || (!isOnline && !effectiveDoctor)}
                    className="w-full max-w-md bg-primary hover:bg-primary/80 text-lg font-semibold py-3 rounded-full"
                  >
                    {loading ? (
                      <BeatLoader color="#ffffff" size={10} aria-label="Loading Spinner" />
                    ) : !isOnline ? (
                      "Save Patient Offline"
                    ) : (
                      "Add Patient"
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

export default AddPatient
