'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import  prisma  from '@/utils/prisma'

export async function verifySession() {
  const supabase = createClient()
  const { data, error } = await supabase.auth.getUser()
  if (error) {
    return null
  }
  return data.user
}

export async function getDoctor() {
  const user = await verifySession()
  if (!user) {
    redirect('/login')
  }

  const doctor = await prisma.doctor.findUnique({
    where: {
      id: user.id,
    },
  })
  return doctor
}


export async function getPatient(patientId: string) {
  const user = await verifySession()
  if (!user) {
    redirect('/login')
  }
  const patient = await prisma.patient.findUnique({
    where: {
      id: patientId,
    },
  })
  return patient
}

export async function getPatientVaccineRecords(patientId: string) {
  const user = await verifySession()
  if (!user) {
    redirect('/login')
  }
  const vaccineRecords = await prisma.vaccinationRecord.findMany({
    where: {
      patientId,
    },
    include: {
      vaccin: true,
      dose: true
    },
  })
  return vaccineRecords
}



export async function getDoctorTrackedVaccines() {
  const user = await verifySession()
  if (!user) {
    redirect('/login')
  }
  const doctor = await prisma.doctor.findUnique({
    where: {
      id: user.id,
    },
    include: {
      trackedVaccines: {
        include: {
          doses: true,
        },
      },
    },
  })
  return doctor?.trackedVaccines
}