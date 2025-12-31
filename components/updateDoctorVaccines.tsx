'use client'

import { useState, useEffect, useMemo } from 'react'
import { Doc } from '@/convex/_generated/dataModel'
import { useForm, useFieldArray } from 'react-hook-form'

// Define DoseType as a union type matching the Convex schema
type DoseType = "regular" | "annual" | "booster" | "unique";
const DoseTypeValues: DoseType[] = ["regular", "annual", "booster", "unique"];
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PlusCircle, Trash2 } from 'lucide-react'
import { updateVaccines } from '@/app/actions'
import { Label } from "@/components/ui/label"
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

// Define the schema for our form
const formSchema = z.object({
  vaccines: z.array(
    z.object({
      id: z.string(),
      name: z.string().min(1, 'Vaccine name is required'),
      description: z.string().nullish(),
      doctorId: z.string(),
      doses: z.array(
        z.object({
          id: z.string(),
          doseCount: z.coerce.number().nullish(),
          maxAge: z.coerce.number().nullish(),
          doseType: z.enum(["regular", "annual", "booster", "unique"]),
        })
      ),
      isSelected: z.boolean(),
      isCustom: z.boolean(),
    })
  ),
})

type FormValues = z.infer<typeof formSchema>

export default function UpdateDoctorVaccines({
  doctorVaccines,
  referenceVaccines,
  doctorId
}: {
  doctorVaccines: (Doc<"vaccins"> & { doses: Doc<"doses">[] })[]
  referenceVaccines: (Doc<"vaccinReferences"> & { doses: Doc<"vaccinReferenceDoses">[] })[]
  doctorId: string
}) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  // console.log('doctorVaccines', doctorVaccines)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      vaccines: doctorVaccines.map((vaccine) => ({
        id: vaccine._id,
        name: vaccine.name,
        doctorId: doctorId,
        isSelected: true,
        isCustom: false,
        doses: vaccine.doses.map(dose => ({
          id: dose._id,
          doseCount: dose.doseCount ?? null,
          maxAge: dose.maxAge ?? null,
          doseType: dose.doseType,
        })),
      }))
    },
  })

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "vaccines",
    keyName: "fieldId"
  })

  console.log('fields', fields)

  const addNewVaccine = () => {
    append({
      id: `new-${Date.now()}`,
      name: '',
      doctorId: doctorId,
      isSelected: true,
      isCustom: true,
      doses: [{
        id: `new-dose-${Date.now()}`,
        doseCount: null,
        maxAge: null,
        doseType: "regular" as DoseType,
      }]
    })
  }

  const addNewDose = (vaccineIndex: number) => {

    const vaccine = fields[vaccineIndex];
    update(vaccineIndex, {
      ...vaccine,
      doses: [
        ...vaccine.doses,
        {
          id: `new-dose-${Date.now()}`,
          doseCount: vaccine.doses.length + 1,
          maxAge: null,
          doseType: "regular" as DoseType,
        }
      ]
    });
  }

  const removeDose = (vaccineIndex: number, doseIndex: number) => {
    const vaccine = fields[vaccineIndex];
    const updatedDoses = vaccine.doses.filter((_, index) => index !== doseIndex);
    update(vaccineIndex, {
      ...vaccine,
      doses: updatedDoses
    });
  }

  const handleVaccineSelection = (index: number, checked: boolean) => {
    if (checked) {
      const vaccine = referenceVaccines[index]
      append({
        id: vaccine._id,
        name: vaccine.name,
        doctorId: doctorId,
        isSelected: true,
        isCustom: false,
        doses: vaccine.doses.map(dose => ({
          id: dose._id,
          doseCount: dose.doseCount ?? null,
          maxAge: dose.maxAge ?? null,
          doseType: dose.doseType,
        })),
      })
    } else {
      remove(index)
    }
  }

  const handleReferenceVaccineSelection = (vaccineId: string) => {
    const selectedVaccine = referenceVaccines.find(v => v._id === vaccineId)
    if (selectedVaccine && !form.getValues().vaccines.some(v => v.name === selectedVaccine.name)) {
      append({
        id: `new-${Date.now()}`,
        name: selectedVaccine.name,
        doctorId: doctorId,
        isSelected: true,
        isCustom: false,
        doses: selectedVaccine.doses.map(dose => ({
          id: `new-dose-${Date.now()}-${dose._id}`,
          doseCount: dose.doseCount ?? null,
          maxAge: dose.maxAge ?? null,
          doseType: dose.doseType,
        })),
      })
    }
  }

  const addedVaccineNames = useMemo(() => {
    return form.getValues().vaccines.map(v => v.name)
  }, [form.getValues().vaccines])

  useEffect(() => {
    // Trigger a re-render when the form values change
    const subscription = form.watch(() => {
      // This empty callback will cause a re-render
    })
    return () => subscription.unsubscribe()
  }, [form])

  async function onSubmit(data: FormValues) {
    setIsLoading(true)
    try {
      const updatedVaccines = data.vaccines
        .filter(v => v.isSelected)
        .map(({ isSelected, isCustom, id, ...vaccine }) => ({
          ...vaccine,
          // Only include _id if it's an existing vaccine (not a new one)
          _id: id.startsWith('new-') ? undefined : id as any,
          doses: vaccine.doses.map(({ id: doseId, ...dose }) => ({
            // Only include _id if it's an existing dose
            _id: doseId.startsWith('new-') ? undefined : doseId as any,
            doseCount: dose.doseCount === 0 ? 0 : (dose.doseCount ?? undefined),
            maxAge: dose.maxAge === 0 ? 0 : (dose.maxAge ?? undefined),
            doseType: dose.doseType,
          })),
        }));
      await updateVaccines(updatedVaccines);
      toast.success('Vaccines updated successfully')
      router.push('/user/profile')
    } catch (error) {
      if (error.success) {
        toast.success('Vaccines updated successfully')
        router.push('/user/profile')
      } else {
        toast.error(error.error)
      }
    } finally {
      setIsLoading(false)
    }
  }

  console.log(form.formState.errors)

  return (
    <div className="mx-auto">
      <div className="flex justify-between items-center mb-4">
        <div className="space-y-2">
          <h1 className='text-2xl font-bold'>Add Vaccines</h1>
        <p className='text-sm text-muted-foreground'>Add the vaccines you want track on your account. Below is a list of vaccines recommended by the World Health Organization and the CDC that you can select to track. When selected, you will be able to modify the details of each vaccine. You can also add your own custom vaccines.</p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={addNewVaccine}
          className="w-96"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Vaccine
        </Button>
      </div>
      <div className="mb-6 px-4 space-y-2">
        <Label htmlFor="referenceVaccine">Add from reference vaccines</Label>
        <Select onValueChange={handleReferenceVaccineSelection}>
          <SelectTrigger id="referenceVaccine">
            <SelectValue placeholder="Select a reference vaccine" />
          </SelectTrigger>
          <SelectContent>
            {referenceVaccines.map((vaccine) => (
              <SelectItem 
                key={vaccine._id} 
                value={vaccine._id}
                disabled={addedVaccineNames.includes(vaccine.name)}
              >
                {vaccine.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {fields.map((field, index) => (
            <Card key={field.id} className="w-full">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`vaccine-${field.id}`}
                      checked={field.isSelected}
                      onCheckedChange={(checked) => {
                        handleVaccineSelection(index, checked as boolean)
                      }}
                    />
                    <label htmlFor={`vaccine-${field.id}`} className="text-sm font-bold leading-none">
                      {field.name}
                    </label>
                  </div>
                  {field.isCustom && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              {field.isSelected && (
                <CardContent>
                  <FormField
                    control={form.control}
                    name={`vaccines.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='font-semibold'>Vaccine Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <h2 className="text-sm font-medium mt-6">Doses</h2>
                  {field.doses.map((dose, doseIndex) => (
                    <div key={dose.id} className=" space-y-2 mt-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">Dose</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDose(index, doseIndex)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <FormField
                        control={form.control}
                        name={`vaccines.${index}.doses.${doseIndex}.doseType`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className='font-semibold'>Dose Type <span className='text-muted-foreground text-sm font-normal'>(Regular, Booster, or Annual)</span></FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select the dose type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                               {DoseTypeValues.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                               ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`vaccines.${index}.doses.${doseIndex}.doseCount`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className='font-semibold'>Dose Count <span className='text-muted-foreground text-sm font-normal'>(1 is the first dose or unique dose, 2 is the second dose, etc.)</span></FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                value={field.value ?? ''} 
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)} 
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`vaccines.${index}.doses.${doseIndex}.maxAge`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className='font-semibold'>Max Age <span className='text-muted-foreground text-sm font-normal'>(Max age in months to receive the dose, 0 is at birth)</span></FormLabel>
                            <FormControl>
                              {/* <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} /> */}
                              <Input 
                                type="number" 
                                {...field} 
                                value={field.value ?? ''} 
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)} 
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addNewDose(index)}
                    className="mt-4 rounded-full"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add New Dose
                  </Button>
                </CardContent>
              )}
            </Card>
          ))}
          <Button type="submit" disabled={isLoading} className="w-fit">
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </Form>
    </div>
  )
}
