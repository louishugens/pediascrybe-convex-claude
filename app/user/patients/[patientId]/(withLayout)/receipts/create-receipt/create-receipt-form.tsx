'use client'

import { useMemo } from 'react';

import { useForm, useFieldArray } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import useDoctor from '@/utils/hooks/useDoctor';
import { useState } from "react";
import BeatLoader from 'react-spinners/BeatLoader';
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from 'sonner'
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, Check, ChevronsUpDown } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { XCircleIcon } from '@heroicons/react/24/outline';
import { Spinner } from '@/components/ui/spinner';


export default function CreateReceiptForm({ patientId }: { patientId: string }) {

  const options = useMemo(() => countryList().getData(), [])

  const schema = z.object({
    currency: z.string().min(1, "Please select the currency"),
    date: z.date({ message: "Please select a date" }),
    services: z
      .array(
        z.object({
          service: z.string().min(1, "Please enter the service name"),
          price: z.number().min(1, "Please enter a valid price"),
        })
      )
      .min(1, "Please add at least one service"),
  })

  type FormValues = z.infer<typeof schema>

  let [loading, setLoading] = useState(false)
  const [currencyOpen, setCurrencyOpen] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      currency: "",
      date: undefined,
      services: [],
    },
  })

  console.log('form errors :>> ', form.formState.errors);

  const doctor = useDoctor()
  const router = useRouter()


  const onSubmit = async (values: FormValues) => {
    setLoading(true)

    try {
      const { services, date, currency } = values
      const myCurrency = currency.split('-')[0]
      const body = { services, date, currency: myCurrency, patientId }
      const res = await fetch('/api/patients/create-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const receipt = await res.json()

      router.refresh()
      router.push(`/user/patients/${patientId}/receipts/${receipt.id}`)

    }
    catch (err) {
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
    <div className="flex flex-col w-full items-start">
      <p className='text-lg text-primary font-bold'>Create Receipt</p>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex bg-muted rounded-md p-8 flex-col mt-4 w-full text-sm">
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
                <Input placeholder="Record type, exam reading, ..." {...field} />
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
              <FormItem className='mt-8 flex flex-col'>
                <FormLabel>Your currency</FormLabel>
                <Popover open={currencyOpen} onOpenChange={setCurrencyOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={currencyOpen}
                        className={cn(
                          "w-full justify-between",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value
                          ? options.find((option) => `${countryToCurrency[option.value]}-(${option.label})` === field.value)
                            ? `${field.value.split('-')[0]} (${field.value.split('-(')[1]?.slice(0, -1)})`
                            : "Select the currency preference"
                          : "Select the currency preference"}
                        <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Search currency..." />
                      <CommandList>
                        <CommandEmpty>No currency found.</CommandEmpty>
                        <CommandGroup>
                          {options.map((option, index) => {
                            const value = `${countryToCurrency[option.value]}-(${option.label})`
                            const label = `${countryToCurrency[option.value]} (${option.label})`
                            return (
                              <CommandItem
                                key={index}
                                value={label}
                                onSelect={() => {
                                  field.onChange(value)
                                  setCurrencyOpen(false)
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value === value ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {label}
                              </CommandItem>
                            )
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex flex-row justify-between">
            <h4 className='text-sm font-semibold mt-8'>Services</h4>
            <button className='px-4 py-0.5 rounded-full bg-primary text-primary-foreground text-sm  mt-4' type='button' onClick={() => append({ service: '', price: 1 })}>
              Add
            </button>
          </div>

          {fields.map((field, index) => {
            return (
              <section key={field.id} className="relative pt-8">
                <XCircleIcon className='h-6 w-6 text-red-500 absolute right-0 top-0 mt-4 mr-4 cursor-pointer' onClick={() => remove(index)} />
                <div className='grid grid-cols-12 gap-4'>
                  <div className="col-span-6">
                    <FormField
                      control={form.control}
                      name={`services.${index}.service`}
                      render={({ field }) => (
                        <FormItem className='mt-8'>
                          <FormLabel>Service</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Record type, exam reading, ..." 
                              {...field}
                              value={field.value ?? ''}
                            />
                          </FormControl>
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
                          <FormControl>
                            <Input 
                              placeholder="Price" 
                              type='number' 
                              {...field}
                              value={field.value ?? ''}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
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

          <button className="py-2 px-4 rounded-full bg-primary text-primary-foreground text-lg font-semibold w-1/2 center mt-8 mx-auto" type='submit'>
            {
              loading
                ?
                <span className='flex flex-row gap-2 items-center justify-center'><span>Saving receipt </span><Spinner aria-label="Loading Spinner" data-testid="loader"/></span>
                :
                "Save receipt"
            }
          </button>
        </form>
      </Form>
    </div>
  );
}
