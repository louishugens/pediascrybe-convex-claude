'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import  prisma  from '@/utils/prisma'
import { Appointment, AppointmentSelect, Doctor, Patient, VaccinationRecord, Vaccin, Dose } from '@/db/schema'
import { db } from '@/db'
import { cache } from 'react'
import { and, desc, gte, like, or } from 'drizzle-orm'
import { eq } from 'drizzle-orm'

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

  const doctor = await db.query.Doctor.findFirst({
    where: eq(Doctor.id, user.id),
  })
  return doctor
})

export const getDoctorById = cache(async (doctorId: string) => {
  const doctor = await db.query.Doctor.findFirst({
    where: eq(Doctor.id, doctorId),
  })
  return doctor
})

export const getPatient = cache(async (patientId: string) => {
  const patient = await db.query.Patient.findFirst({
    where: eq(Patient.id, patientId),
  })
  return patient
})

export async function getPatientVaccineRecords(patientId: string) {
  const user = await verifySession()
  if (!user) {
    redirect('/')
  }
  const vaccineRecords = await db.query.VaccinationRecord.findMany({
    where: eq(VaccinationRecord.patientId, patientId),
    with: {
      vaccin: true,
      dose: true,
    },
    orderBy: desc(VaccinationRecord.date),
  })
  return vaccineRecords
}



export async function getDoctorTrackedVaccines() {
  const user = await verifySession()
  if (!user) {
    redirect('/')
  }
  const doctor = await db.query.Doctor.findFirst({
    where: eq(Doctor.id, user.id),
    with: {
      trackedVaccines: {
        with: {
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
  const vaccinationRecord = await db.query.VaccinationRecord.findFirst({
    where: eq(VaccinationRecord.id, vaccinationRecordId),
    with: {
      vaccin: true,
      dose: true,
    },
  })
  return vaccinationRecord
}

export const getPatients = cache(async (doctorId: string) => {
  const patients = await db.query.Patient.findMany({
    where: eq(Patient.doctorId, doctorId),
    orderBy: desc(Patient.createdAt),
  })
  return patients
})

export const getRecentPatients = cache(async (doctorId: string) => {
  const recentPatients = await db.query.Patient.findMany({
    where: and(eq(Patient.doctorId, doctorId), gte(Patient.createdAt, new Date(Date.now() - 1000 * 60 * 60 * 24 * 30))),
    orderBy: desc(Patient.createdAt),
  })
  return recentPatients
})

export const getAppointments = cache(async (doctorId: string) => {
  const appointments = await db.query.Appointment.findMany({
    where: eq(Appointment.doctorId, doctorId),
    orderBy: desc(Appointment.startDate),
  })
  return appointments
})

export const getRecentAppointments = cache(async (doctorId: string) => {  
  const recentAppointments = await db.query.Appointment.findMany({
    where: and(eq(Appointment.doctorId, doctorId), gte(Appointment.startDate, new Date(Date.now() - 1000 * 60 * 60 * 24 * 30))),  
    orderBy: desc(Appointment.startDate),
  })
  return recentAppointments
})

export const getPatientsWithVaccinationRecords = cache(async (doctorId: string) => {
  const patients = await db.query.Patient.findMany({
    where: eq(Patient.doctorId, doctorId),
    with: {
      VaccinationRecords: true,
    },
    orderBy: desc(Patient.createdAt),
  })
  return patients
})

export const getPatientsWithSearch = cache(async (doctorId: string, search: string) => {
  const patients = await db.query.Patient.findMany({
    where: and(eq(Patient.doctorId, doctorId), or(like(Patient.firstname, `%${search}%`), like(Patient.lastname, `%${search}%`), like(Patient.email, `%${search}%`))),
    orderBy: desc(Patient.createdAt),
  })
  return patients
})


export const getPatientAppointments = cache(async (patientId: string) => {
  const appointments = await db.query.Appointment.findMany({
    where: eq(Appointment.patientId, patientId),
    orderBy: desc(Appointment.startDate),
  })
  return appointments
})