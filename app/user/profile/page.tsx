import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { cookies } from "next/headers";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from '@/components/ui/button';
import { Info, Pencil, X } from 'lucide-react';
import { DeleteVaccinComponent } from '@/components/deleteVaccinComponent';
import { DeleteServiceComponent } from '@/components/deleteServiceComponent';
import { AddServiceForm } from '@/components/addServiceForm';
import { numberToOrdinal } from '@/lib/utils';
import { db } from "@/db"
import { Doctor } from "@/db/schema"
import { eq } from "drizzle-orm"
import { redirect } from 'next/navigation';
import { EditServiceForm } from '@/components/editServiceForm';

async function getDoctor(doctorId: string){
  const doctor = await db.query.Doctor.findFirst({
    where: eq(Doctor.id, doctorId),
    with: {
      trackedVaccines: {
        with: {
          doses: true,
        }
      },
      services: true
    },
  })
  return doctor
}


const ProfilePage = async () => {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const doctorId = user?.id
  if (!doctorId) {
    redirect('/')
  }
  const doctor = await getDoctor(doctorId)

  return (
    <div className='flex flex-col w-full'>
      <div className="w-full h-auto shadow-md rounded-lg p-4 bg-slate-50 ">
        <div className="flex flex-row w-full justify-between">
          <p className=' font-light text-slate-900'>Dr <span className=' font-bold '>{doctor?.firstname} {doctor?.lastname}</span></p>
          <Link 
          className='self-end px-4 py-2 bg-blue-500 text-white rounded-full text-sm' 
          href={`/user/edit-profile`}>Edit Profile</Link>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          {/* <p className="text-sm">Birth date: <span className="font-bold">{format(new Date(patient.birthdate), 'dd-MM-yyyy')}</span></p> */}
          {/* <p className="text-sm">Sex: <span className="font-bold">{doctor.sex}</span></p> */}
          <p className="text-sm font-semibold">Email: <span className="font-normal">{doctor?.email}</span></p>
          <p className="text-sm font-semibold">Phone: <span className="font-normal">{doctor?.phone}</span></p>
          <p className="text-sm font-semibold">Specialty: <span className="font-normal">{doctor?.spec}</span></p>
          <p className="text-sm font-semibold col-span-2">Address: <span className="font-normal">{doctor?.address}</span></p>
        </div>
      </div>
      <div className="w-full h-auto shadow-md rounded-lg p-4 bg-slate-50 mt-4">
        <div className="flex flex-row items-center justify-between mb-4">
          <p className="text-sm font-semibold">Tracked Vaccines</p>
          {doctor?.trackedVaccines.length ? <Link href="/user/profile/add-vaccines" className="text-sm font-semibold text-white bg-blue-500 rounded-full px-4 py-2">Update Vaccines</Link> : <Link href="/user/profile/add-vaccines" className="text-sm font-semibold text-white bg-blue-500 rounded-full px-4 py-2">Add Vaccines</Link>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {doctor?.trackedVaccines?.map((vaccine) => (
            <Card key={vaccine.id} className="rounded-md">
              <CardContent className="p-4 relative">
                <DeleteVaccinComponent vaccineId={vaccine.id} />
                <Popover>
                  <PopoverTrigger>
                    <div className="h-auto px-4 py-2 space-x-2 bg-white hover:bg-slate-100 rounded-md flex flex-row items-start cursor-pointer">
                      <Info className="h-3 w-3 mt-1" />
                      <p className="text-sm font-semibold text-left">{vaccine.name}</p>
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start" side="top">
                    <div className="pl-4 py-2">
                      <p className="text-sm font-semibold">Doses:</p>
                      {vaccine.doses.map((dose) => (
                        <div key={dose.id} className="py-2">
                          {dose?.doseCount && <p className="text-sm">Dose count: <span className="font-semibold">{numberToOrdinal(dose.doseCount)}</span></p>}
                          <p className="text-sm">Dose type: {dose.doseType.charAt(0).toUpperCase() + dose.doseType.slice(1)}</p>
                          {dose?.maxAge !== null && <p className="text-sm">Max age: {dose.maxAge == 0 ? `At birth` : `${dose.maxAge} months`}</p>}
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <div className="w-full h-auto shadow-md rounded-lg p-4 bg-slate-50 mt-4">
        <div className="flex flex-row items-center justify-between mb-4">
          <p className="text-sm font-semibold">Services</p>
          <AddServiceForm className="text-sm font-semibold text-white bg-blue-500 rounded-full px-4 py-2" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {doctor?.services && doctor.services.length > 0 ? (
            doctor.services.map((service) => (
              <Card key={service.id} className="rounded-md">
                <CardContent className="p-4 relative">
                  <DeleteServiceComponent serviceId={service.id} />
                  <div className="h-auto px-4 py-2 space-y-2 bg-white rounded-md">
                    <p className="text-sm font-semibold">{service.name}</p>
                    <p className="text-xs text-slate-600 italic">{service.type}</p>
                    <p className="text-sm text-slate-600">
                      {service.price.toFixed(2)} {service.currency}
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  {/* <Button 
                    variant="outline" 
                    size="icon" 
                    className="w-full text-sm"
                    onClick={() => {
                      setSelectedService(service)
                    }}
                  >
                  <Pencil size={16} /> 
                  Edit
                </Button> */}
                <EditServiceForm service={service} />
              </CardFooter>
            </Card>
            ))
          ) : (
            <p className="text-sm text-slate-500 col-span-full">No services added yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
