'use client'
import Link from 'next/link'
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useState } from "react";
import BeatLoader from 'react-spinners/BeatLoader';
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { CalendarIcon, ArrowLeft } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
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
import { refresh } from '@/app/actions';
import { useSubscriptionGuard } from '@/hooks/use-subscription-guard';

const EditPatient = ({patient, doctorId}) => {
  // const schema = yup.object({
  //   firstname: yup.string().required("Please enter patient's first name"),
  //   lastname:  yup.string().required("Please enter patient's last name"),
  //   email: yup.string().email('Invalid email').nullable(),
  //   birthdate: yup.date().required("Please enter patient's birth date"),
  //   mothername: yup.string(),
  //   sex: yup.string(),
  //   religion: yup.string().nullable(true),
  //   phone: yup.string()
  // }).required();

  const schema = z.object({
    firstname: z.string().min(1, { message: "Please enter patient's first name" }),
    lastname: z.string().min(1, { message: "Please enter patient's last name" }),
    email: z.union([
      z.email({ message: 'Please enter a valid email address.' }),
      z.literal('')
    ]).optional(),
    birthdate: z.date({ message: "Please enter patient's birth date" }),
    mothername: z.string().optional(),
    sex: z.string().min(1, { message: "Please select patient's sex" }),
    religion: z.string().optional(),
    phone: z.string().optional(),
    allergies: z.string().optional(),
    history: z.string().optional(),
    bloodtype: z.string().optional(),
    electrophoresis: z.string().optional(),
  })

  type FormValues = z.infer<typeof schema>
  
  const [loading, setLoading] = useState(false)

  const form = useForm<FormValues>({
    defaultValues:{
      firstname: patient.firstname || null,
      lastname: patient.lastname || null,
      email: patient.email || "",
      phone: patient.phone || "",
      birthdate: new Date(patient.birthdate) || undefined,
      mothername: patient.mothername || "",
      sex: patient.sex || "",
      religion: patient.religion || "",
      allergies: patient.allergies || "",
      history: patient.history || "",
      bloodtype: patient.bloodtype || "",
      electrophoresis: patient.electrophoresis || "",
    },
    resolver: zodResolver(schema),
    mode: 'onBlur',
    reValidateMode: 'onBlur'
  });

  const router = useRouter()
  const { requireSubscription } = useSubscriptionGuard()


  const onSubmit = async (values) => {
    // Check subscription before proceeding
    if (!requireSubscription("update patients")) return;
    
    setLoading(true)
 
    try{
      const {firstname, lastname, email, birthdate, mothername, sex, religion, phone, allergies, history, bloodtype, electrophoresis} = values
      const body = {firstname, lastname, email, birthdate, mothername, sex, religion, phone, id: patient._id, allergies, history, bloodtype, electrophoresis}
      await fetch('/api/patients/updatePatient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      // router.refresh()
      refresh([`/user/patients/${patient._id}`, `/user/patients/${patient._id}/edit-patient`])
      router.push(`/user/patients/${patient._id}`, {scroll: true})

    }
    catch(err){
      console.log(err)
      setLoading(false)
    }
    finally {
      setLoading(false)
    }
  }



  return (
    <div className="py-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl text-primary font-bold">Edit Patient Information</CardTitle>
            <Button variant="outline" size="icon" asChild>
              <Link href={`/user/patients/${patient._id}`}>
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
                      <Input 
                        placeholder="jdoe@gmail.com" 
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
                    {/* <FormControl>
                      <Input type="date" {...field} />
                    </FormControl> */}
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
                    <FormLabel>
                      Blood Type
                      </FormLabel>
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
                    <FormLabel>
                      Electrophoresis
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Electrophoresis" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
                  disabled={loading}
                  className="w-full max-w-md bg-primary hover:bg-primary/80 text-lg font-semibold py-3 rounded-full"
                >
                  {loading ? (
                    <BeatLoader color="#ffffff" size={10} aria-label="Loading Spinner" />
                  ) : (
                    "Save Changes"
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

export default EditPatient