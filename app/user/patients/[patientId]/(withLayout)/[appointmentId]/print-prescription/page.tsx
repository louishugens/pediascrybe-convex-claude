import Print from "@/components/print";
import { Suspense, ViewTransition } from "react";
import PrintPrescriptionSkeleton from "@/components/skeletons/print-prescription-skeleton";
import { getCurrentDoctor } from "@/lib/convex-data";
import { fetchAuthQuery } from "@/lib/auth-server";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

type Params = Promise<{ patientId: string, appointmentId: string }>

const PrintPage = async (props: { params: Params }) => {
  return (
    <>
      <ViewTransition>
        <Suspense fallback={<PrintPrescriptionSkeleton />}>
          <PrintContainer params={props.params} />
        </Suspense>
      </ViewTransition>
    </>
  );
};

export default PrintPage;

async function PrintContainer({ params }: { params: Params }) {
  const { patientId, appointmentId } = await params;
  const doctor = await getCurrentDoctor();

  if (!doctor) {
    return <div>Doctor not found</div>;
  }

  const [appointment, patient] = await Promise.all([
    fetchAuthQuery(api.appointments.getAppointment, {
      appointmentId: appointmentId as Id<"appointments">
    }),
    fetchAuthQuery(api.patients.getPatient, {
      patientId: patientId as Id<"patients">
    }),
  ]);

  return (
    <Print appointment={appointment} patient={patient} doctor={doctor} exams={false} />
  );
}
