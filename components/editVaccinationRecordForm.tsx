'use client'
import { Dose, Vaccin, VaccinationRecord } from '@prisma/client'
import { Form, FormField, FormItem, FormLabel, FormMessage, FormControl } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { useForm } from 'react-hook-form'
import { cn } from '@/lib/utils'
import { numberToOrdinal } from '@/lib/utils'
import { BeatLoader } from 'react-spinners'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Calendar } from '@/components/ui/calendar'
import { updateVaccinationRecord } from '@/app/actions'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function EditVaccinationRecordForm({ vaccinationRecord }: { vaccinationRecord: VaccinationRecord & { vaccin: Vaccin, dose: Dose } }) {

  const router = useRouter()

  const formSchema = z.object({
    date: z.date(),
    lotNumber: z.string(),
    manufacturer: z.string(),
    dosage: z.string(),
    route: z.string(),
    site: z.string(),
    expiration: z.date(),
    notes: z.string().optional(),
  })
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues:{
      date: vaccinationRecord.date,
      lotNumber: vaccinationRecord.lotNumber,
      manufacturer: vaccinationRecord.manufacturer,
      dosage: vaccinationRecord.dosage,
      route: vaccinationRecord.route,
      site: vaccinationRecord.site,
      expiration: vaccinationRecord.expiration,
      notes: vaccinationRecord.notes || '',
    },
  })

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    const res = await updateVaccinationRecord({...data, id: vaccinationRecord.id, patientId: vaccinationRecord.patientId, vaccinId: vaccinationRecord.vaccinId, doseId: vaccinationRecord.doseId, notes: data.notes || null})
    console.log('res', res)
    if (res?.success) {
      toast.success('Vaccination record updated successfully')
      router.push(`/user/patients/${vaccinationRecord.patientId}/vaccines`)
    } else {
      toast.error(res?.error || 'An unexpected error occurred while updating the vaccination record.')
    }
  }

  return (
    <div>
      <Form {...form} >
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 ">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date Administered</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[240px] pl-3 text-left font-normal",
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
                  <PopoverContent className="w-full p-0" align="start">
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
            name="lotNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lot Number</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="manufacturer"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Manufacturer</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dosage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vaccine Dosage</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="route"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vaccine Administration Route</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="site"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vaccine Administration Site</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="expiration"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Vaccine Expiration Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[240px] pl-3 text-left font-normal",
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
                  <PopoverContent className="w-full p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date() 
                      }
                      initialFocus
                      fromYear={new Date().getFullYear()}
                      toYear={new Date().getFullYear() + 30}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className='flex flex-col gap-2'>
            <p className='text-sm font-medium'>Dose Type </p>
            <p className='text-sm'>{vaccinationRecord.dose.doseType.charAt(0).toUpperCase() + vaccinationRecord.dose.doseType.slice(1)}</p>
          </div>

          { 
            vaccinationRecord.dose.doseCount && <div className='flex flex-col gap-2'>
              <p className='text-sm font-medium'>Dose Count </p>
              <p className='text-sm'>{numberToOrdinal(vaccinationRecord.dose.doseCount)}</p>
            </div>
          }

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    value={field.value || ''} 
                    onChange={(e) => field.onChange(e.target.value || null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={form.formState.isSubmitting}> {form.formState.isSubmitting ? <BeatLoader size={10} /> : 'Update Vaccination Record'}</Button>
        </form>
      </Form>
    </div>
  )
}
