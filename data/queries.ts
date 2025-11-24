'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import  prisma  from '@/utils/prisma'
import { cache } from 'react'

export const verifySession = cache(async () => {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  if (error) {
    return null
  }
  return data.user
})

export const getDoctor = cache(async () => {
  const user = await verifySession()
  if (!user) {
    redirect('/')
  }

  const doctor = await prisma.doctor.findUnique({
    where: {
      id: user.id,
    },
  })
  return doctor
})

export const getDoctorById = cache(async (doctorId: string) => {
  const doctor = await prisma.doctor.findUnique({
    where: {
      id: doctorId,
    },
  })
  return doctor
})

export const getPatient = cache(async (patientId: string) => {
  const patient = await prisma.patient.findUnique({
    where: {
      id: patientId,
    },
  })
  return patient
})

export async function getPatientVaccineRecords(patientId: string) {
  const user = await verifySession()
  if (!user) {
    redirect('/')
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
    redirect('/')
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

export async function getVaccinationRecord(vaccinationRecordId: string) {
  const doctorId = await verifySession()
  if(!doctorId) {
    redirect('/')
  }
  const vaccinationRecord = await prisma.vaccinationRecord.findUnique({
    where: { id: vaccinationRecordId },
    include: {
      vaccin: true,
      dose: true
    },
  })
  return vaccinationRecord
}

export const getPatients = cache(async (doctorId: string) => {
  const patients = await prisma.patient.findMany({
    where: {
      doctorId: doctorId,
    },
  })
  return patients
})

export const getRecentPatients = cache(async (doctorId: string) => {
  const recentPatients = await prisma.patient.findMany({
    where: {
      doctorId: doctorId,
      createdAt: {
        gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
      },
    },
  })
  return recentPatients
})

export const getAppointments = cache(async (doctorId: string) => {
  const appointments = await prisma.appointment.findMany({
    where: {
      doctorId: doctorId,
    },
  })
  return appointments
})

export const getRecentAppointments = cache(async (doctorId: string) => {
  const recentAppointments = await prisma.appointment.findMany({
    where: {
      doctorId: doctorId,
      startDate: {
        gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
      },
    },
  })
  return recentAppointments
})

export const getPatientsWithVaccinationRecords = cache(async (doctorId: string) => {
  const patients = await prisma.patient.findMany({
    where: {
      doctorId: doctorId,
    },
    include: {
      VaccinationRecords: true,
    },
  })
  return patients
})

export const getPatientsWithSearch = cache(async (doctorId: string, search: string) => {
  const patients = await prisma.patient.findMany({
    where:{
      doctorId:doctorId,
      OR:[
        {
          firstname:{
            contains: search,
            mode: 'insensitive' 
          }
        },
        {
          lastname:{
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          email:{
            contains: search,
            mode: 'insensitive'
          }
        },
      ] 

    },
  })
  return patients
})


export const getPatientAppointments = cache(async (patientId: string) => {
  const appointments = await prisma.appointment.findMany({
    where: {
      patientId: patientId,
    },
    orderBy: {
      startDate: 'desc',
    },
  })
  return appointments
})