import Print from "@/components/printCharts";
import prisma from "@/utils/prisma";
import {createServerClient} from '@/utils/supabase-server'
import { differenceInDays } from 'date-fns'

async function getAppointment(appointmentId) {
  const appointment = await prisma.appointment.findUnique({
    where:{
      id:appointmentId
    },
  })
  return appointment
}

async function getPatient(patientId) {
  const patient = await prisma.patient.findUnique({
    where:{
      id:patientId
    },
    include: {
      appointments:{
        orderBy:{
          startDate: 'asc'
        }
      },
    },
  })
  return patient
}

async function getDoctor(doctorId) {
  const doctor = await prisma.doctor.findUnique({
    where:{
      id:doctorId
    },
  })
  return doctor
}

export const dynamic = 'force-dynamic';

const PrintPage = async ({params: {patientId}}) => {
  const supabase = createServerClient()
  
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const doctorId = session?.user?.id


  const patient = await getPatient(patientId)
  const doctor = await getDoctor(doctorId)
  const appointments = patient.appointments

  let formatted = []

  appointments.map(appointment =>{
    if(appointment.head){
      let app = {category: differenceInDays(appointment.startDate, patient.birthdate), value: appointment.head}
      formatted.push(app)
    }  
  })

  return (
    <>
      <Print type="hcfa" title="Head Circumference for Age" ylabel="HC (in cm)" xlabel="Age (in days)" patient={patient} doctor={doctor} data-superjson />
    </>
  );
};

export default PrintPage;