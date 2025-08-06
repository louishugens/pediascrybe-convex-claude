'use server'
import { desc, eq } from "drizzle-orm";
import {db} from "@/db";
import { Appointment, Patient } from "./schema";
import { cache } from "react"; 



export const getPatient = cache(async (patientId: string) => {
  const patient = await db.query.Patient.findFirst({
    where: eq(Patient.id, patientId),
  })
  return patient
})

export const getPatientWithAppointments = cache(async (patientId: string) => {
  const patient = await db.query.Patient.findFirst({
    where: eq(Patient.id, patientId),
    with: {
      appointments: {
        limit: 10,
        orderBy: desc(Appointment.startDate),
      }
    }
  })
  return patient
})