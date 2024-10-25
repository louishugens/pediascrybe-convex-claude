'use client'
import { useState } from 'react'
import { Vaccin, VaccinationRecord,  DoseType, Dose } from '@prisma/client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Textarea } from '@/components/ui/textarea'
import { addVaccinationRecord } from '@/app/actions'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { numberToOrdinal } from '@/lib/utils'
import BeatLoader from 'react-spinners/BeatLoader'


const formSchema = z.object({
  vaccinId: z.string(),
  lotNumber: z.string().min(1, 'Lot number is required'),
  patientId: z.string(),
  date: z.date(),
  notes: z.string().nullable(),
  manufacturer: z.string().min(1, 'Manufacturer is required'),
  expiration: z.date(),
  doseId: z.string(),
  dosage: z.string(),
  route: z.string(),
  site: z.string(),
})

// Infer the form values type from the schema
type FormValues = z.infer<typeof formSchema>

export default function AddVaccineForm({ vaccines, patientId }: { vaccines: (Vaccin & { doses: Dose[] })[], patientId: string }) {
  const [selectedVaccine, setSelectedVaccine] = useState<(Vaccin & { doses: Dose[] }) | null>(null)
  const [selectedDose, setSelectedDose] = useState<Dose | null>(null)
  const router = useRouter()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vaccinId: selectedVaccine?.id,
      lotNumber: '',
      patientId,
      date: new Date(),
      notes: null,
      expiration: new Date(),
      manufacturer: '',
      doseId: selectedDose?.id,
      dosage: '',
      route: '',
      site: '',
    },
  })

  async function onSubmit(values: FormValues) {
    const res = await addVaccinationRecord(values)
    if (res.success) {
      router.push(`/user/patients/${patientId}/vaccines`)
    } else {
      toast.error(res.error)
    }
  }



  function selectVaccine(vaccineId: string) {
    const vaccine = vaccines.find(v => v.id === vaccineId) || null;
    setSelectedVaccine(vaccine);
    setSelectedDose(null);
    form.setValue('vaccinId', vaccineId);
    
    // Log the selected vaccine directly
    console.log('selectedVaccine', vaccine);
  }

  function selectDose(doseId: string) {
    const dose = selectedVaccine?.doses.find(d => d.id === doseId) || null;
    setSelectedDose(dose);
    console.log('selectedDose', dose);
    form.setValue('doseId', doseId);
  }

  return (
    <div className='flex flex-col gap-8'>
      <Select onValueChange={(value) => selectVaccine(value)}>
        <SelectTrigger>
          <SelectValue placeholder="Select a vaccine" />
        </SelectTrigger>
        <SelectContent>
          {vaccines.map((vaccine) => (
            <SelectItem key={vaccine.id} value={vaccine.id}>
              {vaccine.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedVaccine && (
        <>
          <Select onValueChange={(value) => selectDose(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a dose" />
            </SelectTrigger>
            <SelectContent>
              {selectedVaccine.doses.map((dose) => (
                  <SelectItem key={dose.id} value={dose.id}>{`Dose Type: ${dose.doseType.charAt(0).toUpperCase() + dose.doseType.slice(1)} ${dose.doseCount ? `- Dose Count: ${numberToOrdinal(dose.doseCount)}` : ''} ${dose.maxAge !== null ? `- Max Age: ${dose.maxAge == 0 ? 'At birth' : `${dose.maxAge} months`}` : ''}`}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {
            selectedDose && <Form {...form} >
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
                <p className='text-sm'>{selectedDose?.doseType.charAt(0).toUpperCase() + selectedDose?.doseType.slice(1)}</p>
              </div>

              { 
                selectedDose?.doseCount && <div className='flex flex-col gap-2'>
                  <p className='text-sm font-medium'>Dose Count </p>
                  <p className='text-sm'>{numberToOrdinal(selectedDose.doseCount)}</p>
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

              <Button type="submit" disabled={form.formState.isSubmitting}> {form.formState.isSubmitting ? <BeatLoader size={10} /> : 'Add Vaccination Record'}</Button>
            </form>
          </Form>
          }
        </>
      )}
    </div>
  )
}
