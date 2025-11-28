'use server'
import { asc, desc, eq, and, gte, lte } from "drizzle-orm";
import {db} from "@/db";
import { Appointment, Patient, Service } from "./schema";
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

export const getServicesByDoctorId = cache(async (doctorId: string) => {
  const services = await db
    .select()
    .from(Service)
    .where(eq(Service.doctorId, doctorId))
    .orderBy(asc(Service.name))
  return services
})

const getPrimaryCurrency = cache(async (doctorId: string): Promise<string> => {
  const services = await db
    .select({ currency: Service.currency })
    .from(Service)
    .where(eq(Service.doctorId, doctorId))
    .limit(1)
  
  return services[0]?.currency || 'HTG'
})

export const getTodayRevenue = cache(async (doctorId: string) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const appointments = await db.query.Appointment.findMany({
    where: and(
      eq(Appointment.doctorId, doctorId),
      gte(Appointment.startDate, startOfToday)
    ),
    with: {
      service: true
    }
  });

  const revenue = appointments
    .filter(apt => apt.startDate <= endOfToday && apt.cost)
    .reduce((sum, apt) => sum + (apt.cost || 0), 0);
  
  const currency = await getPrimaryCurrency(doctorId);
  console.log('Today revenue:', { revenue, currency });
  return { revenue, currency };
})

export const getMonthlyRevenue = cache(async (doctorId: string) => {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const appointments = await db.query.Appointment.findMany({
    where: and(
      eq(Appointment.doctorId, doctorId),
      gte(Appointment.startDate, startOfMonth)
    ),
    with: {
      service: true
    }
  });

  // console.log('This month appointments:', appointments);

  const revenue = appointments
    .filter(apt => apt.cost)
    .reduce((sum, apt) => sum + (apt.cost || 0), 0);
  
  const currency = await getPrimaryCurrency(doctorId);
  
  return { revenue, currency };
})

export const getTodayPatients = cache(async (doctorId: string) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const appointments = await db.query.Appointment.findMany({
    where: and(
      eq(Appointment.doctorId, doctorId),
      gte(Appointment.startDate, startOfToday)
    ),
    columns: {
      patientId: true,
      startDate: true
    }
  });

  const uniquePatients = new Set(
    appointments
      .filter(apt => apt.startDate <= endOfToday && apt.patientId)
      .map(apt => apt.patientId)
  );

  return uniquePatients.size;
})

export const getDailyTransactions = cache(async (doctorId: string, date: Date) => {
  // Create date boundaries for the selected day
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  console.log('Querying transactions:', {
    doctorId,
    date: date.toISOString(),
    startOfDay: startOfDay.toISOString(),
    endOfDay: endOfDay.toISOString()
  });

  const appointments = await db.query.Appointment.findMany({
    where: and(
      eq(Appointment.doctorId, doctorId),
      gte(Appointment.startDate, startOfDay),
      lte(Appointment.startDate, endOfDay)
    ),
    with: {
      service: true,
      Patient: true
    },
    orderBy: desc(Appointment.startDate)
  });

  console.log(`Found ${appointments.length} appointments for date ${date.toISOString()}`);

  // Filter and map appointments
  const transactions = appointments
    .filter(apt => {
      if (!apt.Patient) {
        console.log(`Skipping appointment ${apt.id} - no patient`);
        return false;
      }
      return true;
    })
    .map(apt => {
      // Use service if available, otherwise use appointment cost as fallback
      if (apt.service) {
        return {
          id: apt.id,
          date: apt.startDate,
          patientName: `${apt.Patient!.firstname} ${apt.Patient!.lastname}`,
          serviceName: apt.service.name,
          price: apt.cost || 0,
          currency: apt.service.currency
        }
      } else {
        // Fallback for appointments without service
        return {
          id: apt.id,
          date: apt.startDate,
          patientName: `${apt.Patient!.firstname} ${apt.Patient!.lastname}`,
          serviceName: 'No service assigned',
          price: apt.cost || 0,
          currency: 'USD' // Default currency if no service
        }
      }
    });

  console.log(`Returning ${transactions.length} transactions`);
  return transactions;
})

export const getDailyRevenueData = cache(async (doctorId: string, yearToDate: boolean = true) => {
  const startDate = yearToDate 
    ? new Date(new Date().getFullYear(), 0, 1)
    : new Date(0); // All time

  const appointments = await db.query.Appointment.findMany({
    where: and(
      eq(Appointment.doctorId, doctorId),
      gte(Appointment.startDate, startDate)
    ),
    with: {
      service: true
    },
    orderBy: desc(Appointment.startDate)
  });

  // Group by date and sum revenue, track currency
  const dailyData = new Map<string, { revenue: number; currency: string }>();



  appointments
    .filter(apt => apt.cost)
    .forEach(apt => {
      const dateKey = apt.startDate.toISOString().split('T')[0]; // YYYY-MM-DD
      const current = dailyData.get(dateKey) || { revenue: 0, currency: apt.service?.currency || 'HTG' };
      dailyData.set(dateKey, {
        revenue: current.revenue + (apt.cost || 0),
        currency: apt.service?.currency || 'HTG'
      });
    });

  const primaryCurrency = await getPrimaryCurrency(doctorId);

  console.log('Daily data:', dailyData);

  // Convert to array and sort by date
  return Array.from(dailyData.entries())
    .map(([date, data]) => ({
      date,
      revenue: Number(data.revenue.toFixed(2)),
      currency: data.currency || primaryCurrency
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
})

