import EditAppointment from "@/components/edit-appointment";
import { AppointmentSelect, PatientSelect } from "@/db/schema";
import prisma from "@/utils/prisma";
import { createClient } from "@/utils/supabase/server";
import { getServicesByDoctorId } from "@/db/queries";

async function getAppointment(appointmentId: string){
  const appointment = await prisma.appointment.findUnique({
    where:{
      id:appointmentId
    },
  })
  return appointment ? { ...appointment, serviceId: (appointment as any).serviceId ?? null } : null
}

async function getPatient(patientId) {
  const patient = await prisma.patient.findUnique({
    where: {
      id: patientId,
    },
    include: {
      appointments: true,
    },
  })

  return patient ? {
    ...patient,
    appointments: patient.appointments.map(apt => ({ ...apt, serviceId: (apt as any).serviceId ?? null }))
  } : null
}

type Params = Promise<{ patientId: string, appointmentId: string }>

const EditAppointmentPage = async (props: { params: Params }) => {
  const params = await props.params;

  const {
    patientId,
    appointmentId
  } = params;

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const doctorId = user?.id

  const appointment = await getAppointment(appointmentId) as AppointmentSelect | null
  const patient = await getPatient(patientId) as PatientSelect & { appointments: AppointmentSelect[] } | null

  if (!appointment || !patient || !doctorId) {
    return <div>Appointment or patient not found</div>
  }

  const services = await getServicesByDoctorId(doctorId)

  return (
    <EditAppointment appointment={appointment} patientId={patientId} patient={patient} services={services} data-superjson />
  )
}

export default EditAppointmentPage


