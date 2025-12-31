import Print from "@/components/printReport";
import ReportViewSkeleton from "@/components/skeletons/report-view-skeleton";
import { Suspense, ViewTransition } from "react";
import { getCurrentDoctor } from "@/lib/convex-data";
import { fetchAuthQuery } from "@/lib/auth-server";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

type Params = Promise<{ patientId: string, reportId: string }>

const ReportPage = async (props: { params: Params }) => {
  return (
    <>
      <ViewTransition>
        <Suspense fallback={<ReportViewSkeleton />}>
          <ReportContainer params={props.params} />
        </Suspense>
      </ViewTransition>
    </>
  );
}

export default ReportPage;

async function ReportContainer({ params }: { params: Params }) {
  const { patientId, reportId } = await params;
  const doctor = await getCurrentDoctor();

  if (!doctor) {
    return <div>Doctor not found</div>;
  }

  const [report, patient] = await Promise.all([
    fetchAuthQuery(api.reports.getReport, {
      reportId: reportId as Id<"reports">
    }),
    fetchAuthQuery(api.patients.getPatient, {
      patientId: patientId as Id<"patients">
    }),
  ]);

  if (!report || !patient) {
    return <div>Report or patient not found</div>;
  }

  return (
    <Print doctor={doctor} patient={patient} report={report} />
  )
}
