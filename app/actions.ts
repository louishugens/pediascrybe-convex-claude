'use server'
import supabase from "@/utils/supabase-ssr"
import { Dose, Vaccin } from "@prisma/client"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import prisma from "@/utils/prisma"

export async function refresh(paths: string[]) {
  for (const path of paths) {
    revalidatePath(path)
  }
}

export async function verifySession() {
  const {data: {user}} = await supabase.auth.getUser()
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
  await prisma.vaccin.delete({
    where: { id: vaccineId, doctorId },
    include: { doses: true }, // Include doses to ensure they are deleted
  })
  revalidatePath('/user/profile')
}
