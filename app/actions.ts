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
  const updatedVaccines = await Promise.all(vaccines.map(async (vaccine) => {
    return prisma.vaccin.upsert({
      where: { id: vaccine.id },
      create: {
        name: vaccine.name,
        doctorId: vaccine.doctorId ?? doctorId,
        doses: {
          create: vaccine.doses.map((dose) => ({
            doseCount: dose.doseCount,
            maxAge: dose.maxAge ?? 0,
            doseType: dose.doseType ?? '',
          }))
        }
      },
      update: {
        name: vaccine.name,
        doses: {
          upsert: vaccine.doses.map((dose) => ({
            where: { id: dose.id },
            create: {
              doseCount: dose.doseCount,
              maxAge: dose.maxAge ?? 0,
              doseType: dose.doseType ?? '',
            },
            update: {
              doseCount: dose.doseCount,
              maxAge: dose.maxAge ?? 0,
              doseType: dose.doseType ?? '',
            }
          }))
        }
      },
      include: { doses: true }
    })
  }))

  return updatedVaccines
}
