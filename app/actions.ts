'use server'
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { fetchAuthMutation, fetchAuthQuery, isAuthenticated } from "@/lib/auth-server"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { getCurrentDoctor } from "@/lib/convex-data"

export async function refresh(paths: string[]) {
  for (const path of paths) {
    revalidatePath(path)
  }
}

export async function verifySession() {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    redirect('/')
  }
  const doctor = await getCurrentDoctor()
  if (!doctor) {
    redirect('/')
  }
  return doctor._id
}

interface VaccineInput {
  _id?: Id<"vaccins">;
  name: string;
  doses: {
    _id?: Id<"doses">;
    doseCount?: number;
    maxAge?: number;
    doseType: "regular" | "annual" | "booster" | "unique";
  }[];
}

export async function updateVaccines(vaccines: VaccineInput[]) {
  const doctorId = await verifySession()
  
  const updatedVaccines = await Promise.all(vaccines.map(async (vaccine) => {
    if (vaccine._id) {
      // Update existing vaccine
      return await fetchAuthMutation(api.vaccines.updateVaccine, {
        vaccinId: vaccine._id,
        name: vaccine.name,
        doses: vaccine.doses.map((dose) => ({
          doseCount: dose.doseCount,
          maxAge: dose.maxAge,
          doseType: dose.doseType,
        })),
      })
    } else {
      // Create new vaccine
      return await fetchAuthMutation(api.vaccines.createVaccine, {
        doctorId,
        name: vaccine.name,
        doses: vaccine.doses.map((dose) => ({
          doseCount: dose.doseCount,
          maxAge: dose.maxAge,
          doseType: dose.doseType,
        })),
      })
    }
  }))

  revalidatePath('/user/profile')
  return updatedVaccines
}

export async function deleteVaccine(vaccineId: Id<"vaccins">) {
  await verifySession()
  
  try {
    await fetchAuthMutation(api.vaccines.deleteVaccine, {
      vaccinId: vaccineId,
    })

    revalidatePath('/user/profile')
    return { success: true }
  } catch (error: any) {
    console.error('Error deleting vaccine:', error)
    if (error.message?.includes('vaccination records')) {
      return {
        success: false,
        error: "Cannot delete this vaccine as it has associated vaccination records."
      }
    }
    return {
      success: false,
      error: "An unexpected error occurred while deleting the vaccine."
    }
  }
}

interface VaccinationRecordInput {
  patientId: Id<"patients">;
  vaccinId: Id<"vaccins">;
  doseId: Id<"doses">;
  date: number;
  notes?: string;
  manufacturer: string;
  lotNumber: string;
  expiration: number;
  dosage: string;
  route: string;
  site: string;
}

export async function addVaccinationRecord(vaccinationRecord: VaccinationRecordInput) {
  const doctorId = await verifySession()
  if(!doctorId) {
    redirect('/')
  }
  
  try {
    const newRecord = await fetchAuthMutation(api.vaccines.createVaccinationRecord, vaccinationRecord)
    
    revalidatePath(`/user/patients/${vaccinationRecord.patientId}/vaccines`)
    return { success: true, data: newRecord }
  } catch (error: any) {
    console.error('Error adding vaccination record:', error)
    if (error.message?.includes('already recorded')) {
      return { 
        success: false, 
        error: 'This dose for this vaccine has already been recorded for this patient.' 
      }
    }
    return { 
      success: false, 
      error: 'An unexpected error occurred while adding the vaccination record.' 
    }
  }
}

export async function deleteVaccinationRecord(vaccinationRecordId: Id<"vaccinationRecords">, patientId: Id<"patients">) {
  try {
    await fetchAuthMutation(api.vaccines.deleteVaccinationRecord, {
      recordId: vaccinationRecordId,
    })
    revalidatePath(`/user/patients/${patientId}/vaccines`)
    return { success: true }
  } catch (error) {
    console.error('Error deleting vaccination record:', error)
    return { success: false, error: 'An unexpected error occurred while deleting the vaccination record.' }
  }
}

interface VaccinationRecordUpdate {
  _id: Id<"vaccinationRecords">;
  patientId: Id<"patients">;
  date?: number;
  notes?: string;
  manufacturer?: string;
  lotNumber?: string;
  expiration?: number;
  dosage?: string;
  route?: string;
  site?: string;
}

export async function updateVaccinationRecord(vaccinationRecord: VaccinationRecordUpdate) {
  try {
    await fetchAuthMutation(api.vaccines.updateVaccinationRecord, {
      recordId: vaccinationRecord._id,
      date: vaccinationRecord.date,
      notes: vaccinationRecord.notes,
      manufacturer: vaccinationRecord.manufacturer,
      lotNumber: vaccinationRecord.lotNumber,
      expiration: vaccinationRecord.expiration,
      dosage: vaccinationRecord.dosage,
      route: vaccinationRecord.route,
      site: vaccinationRecord.site,
    })
    revalidatePath(`/user/patients/${vaccinationRecord.patientId}/vaccines`)
    return { success: true }
  } catch (error) {
    console.error('Error updating vaccination record:', error)
    return { success: false, error: 'An unexpected error occurred while updating the vaccination record.' }
  }
}

export async function addService(data: { name: string; price: number; currency: string; type: 'clinical' | 'documentation' }) {
  const doctorId = await verifySession()
  
  try {
    const newService = await fetchAuthMutation(api.services.createService, {
      doctorId,
      name: data.name,
      price: data.price,
      currency: data.currency,
      type: data.type,
    })
    
    revalidatePath('/user/profile')
    return { success: true, data: newService }
  } catch (error) {
    console.error('Error adding service:', error)
    return {
      success: false,
      error: "An unexpected error occurred while adding the service."
    }
  }
}

export async function updateService(data: { id: Id<"services">; name: string; price: number; currency: string; type: 'clinical' | 'documentation' }) {
  try {
    const updatedService = await fetchAuthMutation(api.services.updateService, {
      serviceId: data.id,
      name: data.name,
      price: data.price,
      currency: data.currency,
      type: data.type,
    })
    revalidatePath('/user/profile')
    return { success: true, data: updatedService }
  } catch (error) { 
    console.error('Error updating service:', error)
    return { success: false, error: 'An unexpected error occurred while updating the service.' }
  }
}

export async function deleteService(serviceId: Id<"services">) {
  await verifySession()
  
  try {
    await fetchAuthMutation(api.services.deleteService, {
      serviceId,
    })

    revalidatePath('/user/profile')
    return { success: true }
  } catch (error) {
    console.error('Error deleting service:', error)
    return {
      success: false,
      error: "An unexpected error occurred while deleting the service."
    }
  }
}   

export async function deletePatient(patientId: Id<"patients">) {
  await verifySession()
  
  try {
    const result = await fetchAuthMutation(api.patients.deletePatient, {
      patientId,
    })
    
    revalidatePath('/user/patients')
    return result
  } catch (error: any) {
    console.error('Error deleting patient:', error)
    return { success: false, error: error.message || 'An unexpected error occurred while deleting the patient.' }
  }
}

export async function deleteAppointment(appointmentId: Id<"appointments">, patientId: Id<"patients">) {
  await verifySession()
  
  try {
    await fetchAuthMutation(api.appointments.deleteAppointment, {
      appointmentId,
    })
    revalidatePath(`/user/patients/${patientId}`)
    return { success: true }
  } catch (error) {
    console.error('Error deleting appointment:', error)
    return { success: false, error: 'An unexpected error occurred while deleting the appointment.' }
  }
}
