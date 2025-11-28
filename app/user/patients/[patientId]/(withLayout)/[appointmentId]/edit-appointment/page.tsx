import EditAppointment from "@/components/edit-appointment";
import { AppointmentSelect, PatientSelect } from "@/db/schema";
import prisma from "@/utils/prisma";
import { createClient } from "@/utils/supabase/server";
import { getServicesByDoctorId } from "@/db/queries";
import { Suspense, ViewTransition } from "react";
import { AddAppointmentSkeleton } from "@/components/skeletons/add-appointment-skeleton";


async function getAppointment(appointmentId: string){
  const appointment = await prisma.appointment.findUnique({
    where:{
      id:appointmentId
    },
  })
  return appointment ? { ...appointment, serviceId: (appointment as any).serviceId ?? null } : null
}

async function getPatient(patientId: string) {
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

  return (
    <ViewTransition>
      <Suspense fallback={<AddAppointmentSkeleton />}>
        <EditAppointmentContainer params={props.params} />
      </Suspense>
    </ViewTransition>
  )
}

export default EditAppointmentPage

async function EditAppointmentContainer({ params }: { params: Params }) {

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const doctorId = user?.id
  const { patientId, appointmentId } = await params;

  const appointment = await getAppointment(appointmentId)
  const patient = await getPatient(patientId)
 

  if (!appointment || !patient || !doctorId) {
    return <div>Appointment or patient not found</div>
  }

  const services = await getServicesByDoctorId(doctorId)

  return (
    <EditAppointment appointment={appointment} patientId={patientId} patient={patient} services={services} data-superjson />
  );
}


