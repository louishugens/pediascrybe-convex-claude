import { Card, CardTitle, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Users, Stethoscope } from "lucide-react";
import prisma from "@/utils/prisma";
import { Patient, Appointment, Doctor } from "@prisma/client";
import { createClient } from "@/utils/supabase/server";
import { AgeDistributionChart } from "@/components/AgeDistributionChart"
import { GenderDistributionChart } from "@/components/GenderDistributionChart"
import { ImmunizationStatusChart } from "@/components/ImmunizationStatusChart"
import { CommonConditionsChart } from "@/components/CommonConditionsChart"
import { VaccinationRecord } from "@prisma/client"

async function getPatients(doctorId: string): Promise<Patient[]> {
  const patients = await prisma.patient.findMany({
    where: {
      doctorId: doctorId,
    },
    include: {
      VaccinationRecords: true,
    },
  });
  return patients;
}

async function getAppointments(doctorId: string): Promise<{ id: string; startDate: Date; findings: string | null; }[]> {
  const appointments = await prisma.appointment.findMany({
    where: {
      doctorId: doctorId,
    },
    select: {
      id: true,
      findings: true,
      startDate: true,
    }
  });
  return appointments;
}

async function getRecentPatients(doctorId: string) {
  const recentPatients = await prisma.patient.findMany({
    where: {
      doctorId: doctorId,
      createdAt: {
        gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
      },
    },
  });
  return recentPatients;
  }

async function getRecentAppointments(doctorId: string): Promise<Appointment[]> {
  const recentAppointments = await prisma.appointment.findMany({
    where: {
      doctorId: doctorId,
      startDate: {
        gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
      },
    },
  });
  return recentAppointments;
}

async function getDoctor(doctorId: string): Promise<Doctor> {
  const doctor = await prisma.doctor.findUnique({
    where: {
      id: doctorId,
    },
  });
  if (!doctor) throw new Error("Doctor not found");
  return doctor;
}

export default async function Page() {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const doctorId = session?.user?.id
  if (!doctorId) {
    throw new Error("Doctor ID not found");
  } 
  const patients = await getPatients(doctorId);
  const appointments = await getAppointments(doctorId);
  const recentPatients = await getRecentPatients(doctorId);
  const recentAppointments = await getRecentAppointments(doctorId);
  const doctor = await getDoctor(doctorId);
  
  return (
    <div>
      <h1 className="text-xl font-bold mb-2">Hello <span className="text-primary">Dr. {doctor.firstname} {doctor.lastname}</span></h1>
      <p className="text-sm text-muted-foreground mb-4">Welcome to your dashboard</p> 
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{patients.length}</div>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground italic">Patients registered from start of service</p>
          </CardFooter>
        </Card>
        <Card className="glass card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Recent Patients</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{recentPatients.length}</div>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground italic">Patients registered in the last 30 days</p>
          </CardFooter>
        </Card>
        <Card className="glass card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Consultations</CardTitle>
            <Stethoscope className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{appointments.length}</div>
            {/* <p className="text-xs text-muted-foreground">+124 consultations this month</p> */}
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground italic">Consultations from start of service</p>
          </CardFooter>
        </Card>
        <Card className="glass card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Recent Consultations</CardTitle>
            <Stethoscope className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{recentAppointments.length}</div>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground italic">Consultations in the last 30 days</p>
          </CardFooter>
        </Card>

      </div>  
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 mt-4">
        <AgeDistributionChart patients={patients} />
        <GenderDistributionChart patients={patients} />
        <ImmunizationStatusChart patients={patients} />
        <CommonConditionsChart appointments={appointments} />
      </div>
    </div>
  );
}
