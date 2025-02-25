'use server'
import { createClient } from "@/utils/supabase/server"
import { Dose, Vaccin, VaccinationRecord } from "@prisma/client"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import prisma from "@/utils/prisma"
import { Prisma } from '@prisma/client'

export async function refresh(paths: string[]) {
  for (const path of paths) {
    revalidatePath(path)
  }
}

export async function verifySession() {
  const supabase = createClient()
  const {data: {user}} = await (await supabase).auth.getUser()
  if (!user) {
    redirect('/login')
  }
  return user.id
}

export async function updateVaccines(vaccines: (Vaccin & {doses: Dose[]})[]) {
  const doctorId = await verifySession()
  
  // const updatedVaccines = await Promise.all(vaccines.map(async (vaccine) => {
  //   try {
  //     if (vaccine.id) {
  //       // Check if the vaccine exists
  //       const existingVaccine = await prisma.vaccin.findUnique({
  //         where: { id: vaccine.id },
  //       })

  //       if (!existingVaccine) {
  //         // If the vaccine doesn't exist, create a new one
  //         return await prisma.vaccin.create({
  //           data: {
  //             name: vaccine.name,
  //             doctorId: doctorId,
  //             doses: {
  //               create: vaccine.doses.map((dose) => ({
  //                 doseCount: dose.doseCount,
  //                 maxAge: dose.maxAge,
  //                 doseType: dose.doseType ?? '',
  //               }))
  //             }
  //           },
  //           include: { doses: true }
  //         })
  //       }

  //       // Update existing vaccine
  //       return await prisma.vaccin.update({
  //         where: { id: vaccine.id },
  //         data: {
  //           name: vaccine.name,
  //           doses: {
  //             deleteMany: {
  //               vaccinId: vaccine.id,
  //               id: { notIn: vaccine.doses.map(dose => dose.id).filter(Boolean) as string[] }
  //             },
  //             create: vaccine.doses.filter(dose => !dose.id).map((dose) => ({
  //               doseCount: dose.doseCount,
  //               maxAge: dose.maxAge,
  //               doseType: dose.doseType ?? '',
  //             })),
  //             update: vaccine.doses.filter(dose => dose.id).map((dose) => ({
  //               where: { id: dose.id },
  //               data: {
  //                 doseCount: dose.doseCount,
  //                 maxAge: dose.maxAge,
  //                 doseType: dose.doseType ?? '',
  //               }
  //             }))
  //           }
  //         },
  //         include: { doses: true }
  //       })
  //     } else {
  //       // Create new vaccine
  //       return await prisma.vaccin.create({
  //         data: {
  //           name: vaccine.name,
  //           doctorId: doctorId,
  //           doses: {
  //             create: vaccine.doses.map((dose) => ({
  //               doseCount: dose.doseCount,
  //               maxAge: dose.maxAge,
  //               doseType: dose.doseType ?? '',
  //             }))
  //           }
  //         },
  //         include: { doses: true }
  //       })
  //     }
  //   } catch (error) {
  //     console.error(`Error processing vaccine ${vaccine.id || 'new'}:`, error)
  //     throw error
  //   }
  // }))

  const updatedVaccines = await Promise.all(vaccines.map(async (vaccine) => {
    return await prisma.vaccin.upsert({
      where: { id: vaccine.id },
      update: {
        name: vaccine.name,
        doses: {
          deleteMany: { vaccinId: vaccine.id },
          create: vaccine.doses.map((dose) => ({
            doseCount: dose.doseCount,
            maxAge: dose.maxAge,
            doseType: dose.doseType,
          })),
        },
      },
      create: {
        name: vaccine.name,
        doctorId: doctorId,
        doses: {
          create: vaccine.doses.map((dose) => ({
            doseCount: dose.doseCount,
            maxAge: dose.maxAge,
            doseType: dose.doseType,
          })),
        },
      }
    })
  }))

  revalidatePath('/user/profile')

  // const updatedVaccines = await Promise.all(vaccines.map(async (vaccine) => {

  //   // Step 1: Upsert the vaccine (ignoring doses for now)
  //   const upsertedVaccine = await prisma.vaccin.upsert({
  //     where: { id: vaccine.id },
  //     update: {
  //       name: vaccine.name,
  //       doctorId: doctorId
  //     },
  //     create: {
  //       name: vaccine.name,
  //       doctorId: doctorId,
  //       doses: {
  //         create: vaccine.doses.map((dose) => ({
  //           doseCount: dose.doseCount,
  //           maxAge: dose.maxAge,
  //           doseType: dose.doseType,
  //         })),
  //       },
  //     },
  //   });
  
  //   // Step 2: Update the doses (delete the old ones and create new ones)
  //   await prisma.dose.deleteMany({
  //     where: { vaccinId: upsertedVaccine.id },
  //   });
  
  //   await prisma.dose.createMany({
  //     data: vaccine.doses.map((dose) => ({
  //       doseCount: dose.doseCount,
  //       maxAge: dose.maxAge,
  //       doseType: dose.doseType,
  //       vaccinId: upsertedVaccine.id,
  //     })),
  //   });
  
  //   return upsertedVaccine;
  // }));
  

  return updatedVaccines
}

export async function deleteVaccine(vaccineId: string) {
  const doctorId = await verifySession()
  
  try {
    await prisma.vaccin.delete({
      where: { id: vaccineId, doctorId },
      include: { doses: true },
    })

    revalidatePath('/user/profile')
    return { success: true }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      return {
        success: false,
        error: "Cannot delete this vaccine as it has associated vaccination records."
      }
    }
    console.error('Error deleting vaccine:', error)
    return {
      success: false,
      error: "An unexpected error occurred while deleting the vaccine."
    }
  }
}

export async function addVaccinationRecord(vaccinationRecord: Omit<VaccinationRecord, 'id'>) {
  const doctorId = await verifySession()
  if(!doctorId) {
    redirect('/login')
  }
  
  try {
    const newVaccinationRecord = await prisma.vaccinationRecord.create({
      data: vaccinationRecord,
    })
    
    revalidatePath(`/user/patients/${newVaccinationRecord.patientId}/vaccines`)
    return { success: true, data: newVaccinationRecord }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { 
        success: false, 
        error: 'This dose for this vaccine has already been recorded for this patient.' 
      }
    }
    // Handle other errors
    console.error('Error adding vaccination record:', error)
    return { 
      success: false, 
      error: 'An unexpected error occurred while adding the vaccination record.' 
    }
  }
}

export async function deleteVaccinationRecord(vaccinationRecordId: string, patientId: string) {
  try {
    await prisma.vaccinationRecord.delete({
      where: { id: vaccinationRecordId },
    })
    revalidatePath(`/user/patients/${patientId}/vaccines`)
    return { success: true }
  } catch (error) {
    console.error('Error deleting vaccination record:', error)
    return { success: false, error: 'An unexpected error occurred while deleting the vaccination record.' }
  }
}

export async function updateVaccinationRecord(vaccinationRecord: VaccinationRecord) {
  try {
    await prisma.vaccinationRecord.update({
      where: { id: vaccinationRecord.id },
      data: vaccinationRecord,
    })
    revalidatePath(`/user/patients/${vaccinationRecord.patientId}/vaccines`)
    return { success: true }
  } catch (error) {
    console.error('Error updating vaccination record:', error)
    return { success: false, error: 'An unexpected error occurred while updating the vaccination record.' }
  }
}   