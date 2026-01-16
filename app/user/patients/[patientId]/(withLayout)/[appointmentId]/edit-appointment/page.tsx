import EditAppointment from "@/components/edit-appointment";
import { Suspense, ViewTransition } from "react";
import { AddRecordSkeleton } from "@/components/skeletons/add-record-skeleton";
import { getCurrentDoctor } from "@/lib/convex-data";
import { fetchAuthQuery } from "@/lib/auth-server";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

type Params = Promise<{ patientId: string, appointmentId: string }>

const EditAppointmentPage = async (props: { params: Params }) => {
  return (
    <ViewTransition>
      <Suspense fallback={<AddRecordSkeleton />}>
        <EditAppointmentContainer params={props.params} />
      </Suspense>
    </ViewTransition>
  )
}

export default EditAppointmentPage

async function EditAppointmentContainer({ params }: { params: Params }) {
  const doctor = await getCurrentDoctor();
  const { patientId, appointmentId } = await params;

  if (!doctor) {
    return <div>Doctor not found</div>
  }

  const [appointment, patient, services] = await Promise.all([
    fetchAuthQuery(api.appointments.getAppointment, {
      appointmentId: appointmentId as Id<"appointments">
    }),
    fetchAuthQuery(api.patients.getPatientWithAppointments, {
      patientId: patientId as Id<"patients">
    }),
    fetchAuthQuery(api.services.getServicesByDoctorId, {
      doctorId: doctor._id
    }),
  ])

  if (!appointment || !patient) {
    return <div>Appointment or patient not found</div>
  }

  return (
    <EditAppointment 
      appointment={appointment} 
      patientId={patientId as Id<"patients">} 
      patient={patient} 
      services={services} 
    />
  );
}
