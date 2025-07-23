'use client'
import Link from 'next/link'
import { useForm } from 'react-hook-form';
import * as yup from "yup";
import { yupResolver } from '@hookform/resolvers/yup';
import PulseLoader from "react-spinners/PulseLoader"
import { useRouter } from 'next/navigation';
import useDoctor from '@/utils/hooks/useDoctor';
import { useState } from "react";
import BeatLoader  from 'react-spinners/BeatLoader';
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
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
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { refresh } from '@/app/actions';

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
    firstname: z.string({ error: (issue) => issue.input === undefined ? 
      "Please enter patient's first name" :
      "Not a string" 
      }),
    lastname:  z.string({ error: (issue) => issue.input === undefined ? 
      "Please enter patient's last name" :
      "Not a string" 
      }),
    email: z.string()
    .refine(value => value === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), {
      message: 'Please enter a valid email or leave it empty.',
    }),
    birthdate: z.date({error: (issue) => issue.input === undefined ? 
      "Please enter patient's birth date" :
      "Not a date" 
      }),
    mothername: z.string().optional(),
    sex: z.string(),
    religion: z.string().optional(),
    phone: z.string().optional(),
    allergies: z.string().optional(),
    history: z.string().optional(),
    bloodtype: z.string().optional(),
    electrophoresis: z.string().optional(),
  })

  type FormValues = z.infer<typeof schema>
  
  let [color, setColor] = useState("#ffffff")
  let [loading, setLoading] = useState(false)

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
    resolver: zodResolver(schema)
  });

  console.log(patient)

  const router = useRouter()


  const onSubmit = async (values) => {
    setLoading(true)
 
    try{
      const {firstname, lastname, email, birthdate, mothername, sex, religion, phone, allergies, history, bloodtype, electrophoresis} = values
      const body = {firstname, lastname, email, birthdate, mothername, sex, religion, phone, id: patient.id, allergies, history, bloodtype, electrophoresis}
      await fetch('/api/patients/updatePatient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      // router.refresh()
      refresh([`/user/patients/${patient.id}`, `/user/patients/${patient.id}/edit-patient`])
      router.push(`/user/patients/${patient.id}`, {scroll: true})

    }
    catch(err){
      console.log(err)
    }
    // router.push(`/user/patients/${patient.id}`)
  }



  return (
    <div className='pt-4'>
      <div className="flex flex-col w-full items-center">
        <p className=' text-2xl text-primary font-bold mt-8'>Update Patient</p>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex bg-muted rounded-md p-8 flex-col mt-8 w-2/3 text-sm">
            <div className="grid gap-x-8 gap-y-8 grid-cols-2 mt-4">
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
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
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
                  <FormItem className='mt-8'>
                    <FormLabel>History</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Medical history" {...field} />
                      {/* <Input placeholder="History" {...field} /> */}
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
                    "Update Patient"
              }
            </button>
          </form>
        </Form>

        {/* <p className=' text-2xl text-green-500 font-bold'>Edit Patient</p>
        <form className="flex flex-col mt-8 w-2/3 text-sm" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-x-8 gap-y-4 grid-cols-2 mt-4">
            <label className="flex flex-col mb-4 h-16">
              <span className="font-medium">First name</span>
              <input
                placeholder="John"
                className="placeholder:italic placeholder:text-sm bg-white shadow-md rounded-full py-2 px-4 border-none"
                type="text"
                {...register('firstname')}
              />
              <p className='px-4 pt-1 text-sm text-red-600'>{errors.firstname?.message}</p>
            </label>
            <label className="flex flex-col mb-4 h-16">
              <span className="font-medium">Last name</span>
              <input
                placeholder="Doe"
                className="placeholder:italic placeholder:text-sm bg-white shadow-md rounded-full py-2 px-4 border-none"
                type="text"
                {...register('lastname')}
              />
              <p className='px-4 pt-1 text-sm text-red-600'>{errors.lastname?.message}</p>
            </label>
            <label className="flex flex-col mb-4 h-16">
              <span className="font-medium">Mother&apos;s name</span>
              <input
                placeholder="Jane Doe"
                className="placeholder:italic placeholder:text-sm bg-white shadow-md rounded-full py-2 px-4 border-none"
                type="text"
                {...register('mothername')}
              />
              <p className='px-4 pt-1 text-sm text-red-600'>{errors.mothername?.message}</p>
            </label>
            <label className="flex flex-col mb-4 h-16">
              <span className="font-medium">Phone</span>
              <input
                placeholder="+50937000000"
                className="placeholder:italic placeholder:text-sm bg-white shadow-md rounded-full py-2 px-4 border-none"
                type="tel"
                {...register('phone')}
              />
              <p className='px-4 pt-1 text-sm text-red-600'>{errors.phone?.message}</p>
            </label>
            <label className="flex flex-col mb-4 h-16">
              <span className="font-medium">Email</span>
              <input
                placeholder="johndoe@example.com"
                className="placeholder:italic placeholder:text-sm bg-white shadow-md rounded-full py-2 px-4 border-none"
                type="email"
                {...register('email')}
              />
              <p className='px-4 pt-1 text-sm text-red-600'>{errors.email?.message}</p>
            </label>
            <label className="flex flex-col mb-4 h-16">
              <span className="font-medium">Sex</span>
              <select
                // placeholder="Doe"
                // className="placeholder:italic bg-white shadow-md rounded-full py-2 px-4"
                // type="text"
                {...register('sex')}
              >
                <option value="female">female</option>
                <option value="male">male</option>
              </select>
              <p className='px-4 pt-1 text-sm text-red-600'>{errors.sex?.message}</p>
            </label>
            <label className="flex flex-col mb-4 h-16">
              <span className="font-medium">Religion</span>
              <input
                placeholder="Catholic"
                className="placeholder:italic placeholder:text-sm bg-white shadow-md rounded-full py-2 px-4 border-none"
                type="text"
                {...register('religion')}
              />
              <p className='px-4 pt-1 text-sm text-red-600'>{errors.religion?.message}</p>
            </label>
            <label className="flex flex-col mb-6 h-16">
              <span className="font-medium">Birth Date</span>
              <input
                placeholder="Birth date of the patient"
                className="placeholder:italic placeholder:text-sm bg-white shadow-md rounded-full py-2 px-4 border-none"
                type="date"
                {...register('birthdate')}
              />
              <p className='px-4 pt-1 text-sm text-red-600'>{errors.birthdate?.message}</p>
            </label>
          </div>

          <button className="py-2 px-4 rounded-full bg-green-500 text-lg font-semibold w-1/2 center mt-4 mx-auto" type='submit'>
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
                  "Edit Patient"
            }
          </button>
        </form> */}
      </div>
    </div>
  )
}

export default EditPatient