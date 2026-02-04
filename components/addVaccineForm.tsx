'use client'
import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'
import { CalendarIcon, AlertTriangle, Clock, Sparkles, X, Plus, Syringe } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Textarea } from '@/components/ui/textarea'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { addVaccinationRecord } from '@/app/actions'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { numberToOrdinal } from '@/lib/utils'
import { Spinner } from '@/components/ui/spinner'
import { Id } from '@/convex/_generated/dataModel'
import {
  calculatePatientAgeInMonths,
  calculateOverallCompliance,
  type Vaccine,
  type VaccinationRecord as VaxRecord,
} from '@/lib/vaccination-compliance'

interface Dose {
  _id: Id<"doses">;
  doseType: string;
  doseCount?: number | null;
  maxAge?: number | null;
}

interface Vaccin {
  _id: Id<"vaccins">;
  name: string;
  doses: Dose[];
}

interface PendingDose {
  vaccineId: string;
  vaccineName: string;
  doseId: string;
  status: 'overdue' | 'due';
  label: string;
  detail: string;
  /** Negative = overdue, positive = due soon. Used for sorting. */
  monthsDelta: number;
}

interface QueuedRecord {
  id: string; // unique id for UI key
  vaccinId: string;
  vaccineName: string;
  doseId: string;
  doseLabel: string;
  lotNumber: string;
  date: Date;
  notes: string | null;
  manufacturer: string;
  expiration: Date;
  dosage: string;
  route: string;
  site: string;
}

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

interface AddVaccineFormProps {
  vaccines: Vaccin[];
  patientId: string;
  birthdate?: number;
  vaccinationRecords?: VaxRecord[];
}

export default function AddVaccineForm({ vaccines, patientId, birthdate, vaccinationRecords }: AddVaccineFormProps) {
  const [selectedVaccine, setSelectedVaccine] = useState<Vaccin | null>(null)
  const [selectedDose, setSelectedDose] = useState<Dose | null>(null)
  const [selectKey, setSelectKey] = useState(0)
  const [doseSelectKey, setDoseSelectKey] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [recommendationsOpen, setRecommendationsOpen] = useState<string | undefined>('recommendations')
  const [queuedRecords, setQueuedRecords] = useState<QueuedRecord[]>([])
  const router = useRouter()

  // Compute pending doses (overdue + due) from compliance data
  const pendingDoses = useMemo<PendingDose[]>(() => {
    if (!birthdate || !vaccinationRecords) return [];

    const ageInMonths = calculatePatientAgeInMonths(birthdate);
    const compliance = calculateOverallCompliance(
      vaccines as unknown as Vaccine[],
      ageInMonths,
      vaccinationRecords,
    );

    const pending: PendingDose[] = [];
    for (const vc of compliance.vaccines) {
      for (const ds of vc.doseStatuses) {
        if (ds.status !== 'overdue' && ds.status !== 'due') continue;
        const doseCount = ds.dose.doseCount;
        const ordinal = doseCount
          ? `${numberToOrdinal(doseCount)} dose`
          : 'Dose';
        const typeSuffix = ds.dose.doseType !== 'regular' ? ` (${ds.dose.doseType})` : '';
        const absMonths = Math.abs(ds.monthsDelta ?? 0);
        let detail: string;
        if (ds.status === 'overdue') {
          detail = absMonths < 1
            ? `${Math.round(absMonths * 30)} days overdue`
            : `${Math.round(absMonths)} mo overdue`;
        } else {
          detail = absMonths < 1
            ? `Due in ${Math.round(absMonths * 30)} days`
            : `Due in ${Math.round(absMonths)} mo`;
        }
        pending.push({
          vaccineId: vc.vaccine._id as string,
          vaccineName: vc.vaccine.name,
          doseId: ds.dose._id as string,
          status: ds.status as 'overdue' | 'due',
          label: `${vc.vaccine.name} — ${ordinal}${typeSuffix}`,
          detail,
          monthsDelta: ds.monthsDelta ?? 0,
        });
      }
    }

    // Sort by monthsDelta ascending (most negative = most overdue first)
    pending.sort((a, b) => a.monthsDelta - b.monthsDelta);

    return pending;
  }, [vaccines, birthdate, vaccinationRecords]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vaccinId: selectedVaccine?._id,
      lotNumber: '',
      patientId,
      date: new Date(),
      notes: null,
      expiration: new Date(),
      manufacturer: '',
      doseId: selectedDose?._id,
      dosage: '',
      route: '',
      site: '',
    },
  })

  function getDoseLabel(dose: Dose): string {
    const typeLabel = dose.doseType.charAt(0).toUpperCase() + dose.doseType.slice(1);
    const countLabel = dose.doseCount ? ` - ${numberToOrdinal(dose.doseCount)}` : '';
    return `${typeLabel}${countLabel}`;
  }

  function addToQueue(values: FormValues) {
    if (!selectedVaccine || !selectedDose) return;

    const record: QueuedRecord = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      vaccinId: values.vaccinId,
      vaccineName: selectedVaccine.name,
      doseId: values.doseId,
      doseLabel: getDoseLabel(selectedDose),
      lotNumber: values.lotNumber,
      date: values.date,
      notes: values.notes,
      manufacturer: values.manufacturer,
      expiration: values.expiration,
      dosage: values.dosage,
      route: values.route,
      site: values.site,
    };

    setQueuedRecords(prev => [...prev, record]);

    // Reset form for next entry
    form.reset({
      vaccinId: '',
      lotNumber: '',
      patientId,
      date: new Date(),
      notes: null,
      expiration: new Date(),
      manufacturer: '',
      doseId: '',
      dosage: '',
      route: '',
      site: '',
    });
    setSelectedVaccine(null);
    setSelectedDose(null);
    setSelectKey(prev => prev + 1);
    setDoseSelectKey(prev => prev + 1);
    setRecommendationsOpen('recommendations');

    toast.success(`${selectedVaccine.name} added to queue`);
  }

  function removeFromQueue(id: string) {
    setQueuedRecords(prev => prev.filter(r => r.id !== id));
  }

  async function saveAllRecords() {
    if (queuedRecords.length === 0) return;

    setIsLoading(true);
    let successCount = 0;
    let errorCount = 0;

    for (const record of queuedRecords) {
      try {
        const res = await addVaccinationRecord({
          patientId: patientId as Id<"patients">,
          vaccinId: record.vaccinId as Id<"vaccins">,
          doseId: record.doseId as Id<"doses">,
          date: record.date.getTime(),
          notes: record.notes || undefined,
          manufacturer: record.manufacturer,
          lotNumber: record.lotNumber,
          expiration: record.expiration.getTime(),
          dosage: record.dosage,
          route: record.route,
          site: record.site,
        });
        if (res.success) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch {
        errorCount++;
      }
    }

    setIsLoading(false);

    if (errorCount === 0) {
      toast.success(`${successCount} vaccination record${successCount > 1 ? 's' : ''} saved successfully`);

      // Reset everything
      form.reset();
      setSelectedVaccine(null);
      setSelectedDose(null);
      setSelectKey(prev => prev + 1);
      setDoseSelectKey(prev => prev + 1);
      setRecommendationsOpen('recommendations');
      setQueuedRecords([]);

      router.push(`/user/patients/${patientId}/vaccines`);
    } else {
      toast.error(`${errorCount} record${errorCount > 1 ? 's' : ''} failed to save. ${successCount} saved successfully.`);
      // Remove successful records from queue (keep failed ones for retry)
      // For simplicity, we'll just clear all since we can't track which failed
      setQueuedRecords([]);
    }
  }

  function selectVaccine(vaccineId: string) {
    const vaccine = vaccines.find(v => v._id === vaccineId) || null;
    setSelectedVaccine(vaccine);
    setSelectedDose(null);
    form.setValue('vaccinId', vaccineId);
    setRecommendationsOpen(undefined); // Close accordion when selecting from dropdown
  }

  function selectDose(doseId: string) {
    const vaccine = selectedVaccine || vaccines.find(v => v.doses.some(d => d._id === doseId)) || null;
    const dose = vaccine?.doses.find(d => d._id === doseId) || null;
    setSelectedDose(dose);
    form.setValue('doseId', doseId);
  }

  function selectRecommendation(rec: PendingDose) {
    const vaccine = vaccines.find(v => v._id === rec.vaccineId) || null;
    if (!vaccine) return;
    const dose = vaccine.doses.find(d => d._id === rec.doseId) || null;
    if (!dose) return;

    setSelectedVaccine(vaccine);
    setSelectedDose(dose);
    form.setValue('vaccinId', rec.vaccineId);
    form.setValue('doseId', rec.doseId);

    // Force re-render of Select components with new values
    setSelectKey(prev => prev + 1);
    setDoseSelectKey(prev => prev + 1);

    // Close recommendations accordion
    setRecommendationsOpen(undefined);
  }

  return (
    <div className='flex flex-col gap-8'>
      {/* Queued records */}
      {queuedRecords.length > 0 && (
        <div className='rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 p-4'>
          <div className='flex items-center justify-between mb-3'>
            <div className='flex items-center gap-2'>
              <Syringe className='h-4 w-4 text-emerald-600 dark:text-emerald-400' />
              <span className='text-sm font-semibold text-emerald-800 dark:text-emerald-300'>
                Queued Records ({queuedRecords.length})
              </span>
            </div>
            <Button
              type='button'
              size='sm'
              onClick={saveAllRecords}
              disabled={isLoading}
              className='bg-primary disabled:bg-primary/50 text-primary-foreground'
            >
              {isLoading ? <span className='flex items-center gap-2'><span>Saving records</span><Spinner aria-label='Saving' className='h-3 w-3' /></span> : `Save All (${queuedRecords.length})`}
            </Button>
          </div>
          <div className='flex flex-col gap-2'>
            {queuedRecords.map((record) => (
              <div
                key={record.id}
                className='flex items-center justify-between gap-3 rounded-lg bg-white dark:bg-emerald-900/30 px-3 py-2 shadow-sm'
              >
                <div className='flex-1 min-w-0'>
                  <p className='text-sm font-medium text-foreground truncate'>
                    {record.vaccineName}
                  </p>
                  <p className='text-xs text-muted-foreground'>
                    {record.doseLabel} · {format(record.date, 'MMM d, yyyy')} · {record.manufacturer}
                  </p>
                </div>
                <button
                  type='button'
                  onClick={() => removeFromQueue(record.id)}
                  className='p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-muted-foreground hover:text-red-600 transition-colors'
                >
                  <X className='h-4 w-4' />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations accordion */}
      {pendingDoses.length > 0 && (
        <Accordion type="single" collapsible value={recommendationsOpen} onValueChange={setRecommendationsOpen} className='rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20'>
          <AccordionItem value="recommendations" className="border-none">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className='flex items-center gap-2'>
                <Sparkles className='h-4 w-4 text-amber-600 dark:text-amber-400' />
                <span className='text-sm font-semibold text-amber-800 dark:text-amber-300'>
                  Recommended — Pending Doses ({pendingDoses.length})
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-0">
              <div className='flex flex-col gap-1.5'>
                {pendingDoses.map((rec) => (
                  <button
                    type='button'
                    key={`${rec.vaccineId}-${rec.doseId}`}
                    onClick={() => selectRecommendation(rec)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors w-full',
                      selectedVaccine?._id === rec.vaccineId && selectedDose?._id === rec.doseId
                        ? 'bg-amber-200/60 dark:bg-amber-900/40 ring-1 ring-amber-400/50'
                        : 'hover:bg-amber-100/60 dark:hover:bg-amber-900/20',
                    )}
                  >
                    {rec.status === 'overdue' ? (
                      <AlertTriangle className='h-3.5 w-3.5 text-red-500 shrink-0' />
                    ) : (
                      <Clock className='h-3.5 w-3.5 text-amber-500 shrink-0' />
                    )}
                    <span className='flex-1 text-sm text-foreground truncate'>{rec.label}</span>
                    <span className={cn(
                      'text-[11px] whitespace-nowrap',
                      rec.status === 'overdue'
                        ? 'text-red-600 dark:text-red-400 font-medium'
                        : 'text-amber-600 dark:text-amber-400',
                    )}>
                      {rec.detail}
                    </span>
                  </button>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      <Select key={selectKey} value={selectedVaccine?._id} onValueChange={(value) => selectVaccine(value)}>
        <SelectTrigger>
          <SelectValue placeholder="Select a vaccine" />
        </SelectTrigger>
        <SelectContent>
          {vaccines.map((vaccine) => (
            <SelectItem key={vaccine._id} value={vaccine._id}>
              {vaccine.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedVaccine && (
        <>
          <Select key={doseSelectKey} value={selectedDose?._id} onValueChange={(value) => selectDose(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a dose" />
            </SelectTrigger>
            <SelectContent>
              {selectedVaccine.doses.map((dose) => (
                  <SelectItem key={dose._id} value={dose._id}>{`Dose Type: ${dose.doseType.charAt(0).toUpperCase() + dose.doseType.slice(1)} ${dose.doseCount ? `- Dose Count: ${numberToOrdinal(dose.doseCount)}` : ''} ${dose.maxAge !== null ? `- Max Age: ${dose.maxAge == 0 ? 'At birth' : `${dose.maxAge} months`}` : ''}`}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {
            selectedDose && <Form {...form} >
            <form onSubmit={form.handleSubmit(addToQueue)} className="space-y-8 ">
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
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          captionLayout="dropdown"
                          fromYear={new Date().getFullYear()}
                          toYear={new Date().getFullYear() + 10}
                          initialFocus
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

              <div className='flex gap-3'>
                <Button type="submit" variant="outline" className='flex items-center gap-2'>
                  <Plus className='h-4 w-4' />
                  Add to Queue
                </Button>
                {/* {queuedRecords.length > 0 && (
                  <Button
                    type='button'
                    onClick={saveAllRecords}
                    disabled={isLoading}
                    className='bg-primary disabled:bg-primary/50 text-primary-foreground'
                  >
                    {isLoading ? (
                      <span className='flex items-center gap-2'>
                        <Spinner aria-label='Saving' className='h-4 w-4' />
                        Saving...
                      </span>
                    ) : (
                      `Save All (${queuedRecords.length})`
                    )}
                  </Button>
                )} */}
              </div>
            </form>
          </Form>
          }
        </>
      )}
    </div>
  )
}
