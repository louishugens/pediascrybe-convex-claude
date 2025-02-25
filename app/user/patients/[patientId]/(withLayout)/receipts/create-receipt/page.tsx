'use client'

import { useMemo, use } from 'react';

import { useForm, useFieldArray } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import useDoctor from '@/utils/hooks/useDoctor';
import { useState } from "react";
import BeatLoader  from 'react-spinners/BeatLoader';
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Toaster, toast } from 'sonner'
import countryList from 'react-select-country-list'
import countryToCurrency from 'country-to-currency'
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

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { XCircleIcon } from '@heroicons/react/24/outline';


const CreateReceiptPage = props => {
  const params = use(props.params);

  const {
    patientId
  } = params;

  const options = useMemo(() => countryList().getData(), [])

  const schema = z.object({
    currency: z.string({ required_error: "Please select the currency" }),
    date: z.date({required_error: "Please enter patient's birth date"}),
    services: z
    .array(
      z.object({
        service: z.string({ required_error: "Please select the currency" }),
        price: z.coerce.number({ required_error: "Please enter the cost for the service" }),
      })
    )
    .min(1, {
      message: "Please add at least one service",
    }),
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

  console.log('serviceerror :>> ', form.formState.errors.services?.message);

  const doctor: Doctor | null = useDoctor()
  const router = useRouter()


  const onSubmit = async (values: FormValues) => {
    setLoading(true)
 
    try{
      const {services, date, currency} = values
      const myCurrency = currency.split('-')[0]
      const body = {services, date, currency: myCurrency, patientId}
      const res = await fetch('/api/patients/create-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const receipt = await res.json()

      router.refresh()
      router.push(`/user/patients/${patientId}/receipts/${receipt.id}`)

    }
    catch(err){
      console.log(err)
      setLoading(false)
      toast.error('Something went wrong. Please try again later')
    }
    // router.push(`/user/patients`)
  }

  const { fields, append, prepend, remove } = useFieldArray({
    name: "services",
    control: form.control,
    rules: {
      required: "Please append at least 1 prescription"
    }
  });


  return ( 
  <div className="flex flex-col w-full items-center">
    <Toaster richColors position="top-center" />
    <p className='text-lg text-primary font-bold mt-8'>Create Receipt</p>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex bg-muted rounded-md p-8 flex-col mt-8 w-2/3 text-sm">
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className='flex flex-col gap-y-1'>
              <FormLabel>Transaction Date</FormLabel>
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
                    defaultMonth={new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* <FormField
          control={form.control}
          name='service'
          render={({ field }) => (
            <FormItem className='mt-8'>
              <FormLabel>Service</FormLabel>
                <Input placeholder="Consultation, exam reading, ..." {...field} />
              <FormMessage />
            </FormItem>
          )}
        /> */}
        {/* <FormField
          control={form.control}
          name="cost"
          render={({ field }) => (
            <FormItem className='mt-8'>
              <FormLabel>Cost</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Cost" 
                  type='number' 
                  // onChange={event => field.onChange(+event.target.value)}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}  
        /> */}
        <FormField
          control={form.control}
          name='currency'
          render={({ field }) => (
            <FormItem className='mt-8'>
              <FormLabel>Your currency</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select the currency preference" className='italic'/>
                  </SelectTrigger>
                </FormControl>
                <ScrollArea>
                <SelectContent>
                  {
                    options.map((option, index) => (
                      <SelectItem key={index} value={`${countryToCurrency[option.value]}-(${option.label})`}>{`${countryToCurrency[option.value]} (${option.label})`}</SelectItem>
                    ))
                  }
                  {/* <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="LOCAL">Local Currency</SelectItem> */}
                </SelectContent>
                </ScrollArea>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex flex-row justify-between">
          <h4 className='text-sm font-semibold mt-8'>Services</h4>
          <button className='px-4 py-0.5 rounded-full bg-blue-500 text-white text-sm  mt-4' type='button' onClick={() => append({service: '', price: 50})}>
            Add
          </button>
        </div>

        {fields.map((field, index) => {
          return (
            <section key={field.id} className="relative pt-8">
              <XCircleIcon className='h-6 w-6 text-red-500 absolute right-0 top-0 mt-4 mr-4 cursor-pointer' onClick={() => remove(index)}/>
              <div className='grid grid-cols-12 gap-4'>
                <div className="col-span-6">
                  <FormField
                    control={form.control}
                    name={`services.${index}.service`}
                    render={({ field }) => (
                      <FormItem className='mt-8'>
                        <FormLabel>Service</FormLabel>
                          <Input placeholder="Consultation, exam reading, ..." {...field} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="col-span-6">
                  <FormField
                    control={form.control}
                    name={`services.${index}.price`}
                    render={({ field }) => (
                      <FormItem className='mt-8'>
                        <FormLabel>Price</FormLabel>
                          <Input placeholder="Price" type='number' {...field} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>    
            </section>
          )
        })}
        <p className='px-4 pt-1 text-sm text-red-600'>{form.formState.errors?.services?.message as React.ReactNode}</p>

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
                "Create receipt"
          }
        </button>
      </form>
    </Form>
  </div>
   );
}
 
export default CreateReceiptPage;