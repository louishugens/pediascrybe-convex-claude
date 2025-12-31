import Print from "@/components/printReceipt";
import ReceiptViewSkeleton from "@/components/skeletons/receipt-view-skeleton";
import { headers } from "next/headers";
import { Suspense, ViewTransition } from "react";
import { getCurrentDoctor } from "@/lib/convex-data";
import { fetchAuthQuery } from "@/lib/auth-server";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

type Params = Promise<{ patientId: string, receiptId: string }>

const ReceiptPage = async (props: { params: Params }) => {
  return (
    <>
      <ViewTransition>
        <Suspense fallback={<ReceiptViewSkeleton />}>
          <ReceiptContainer params={props.params} />
        </Suspense>
      </ViewTransition>
    </>
  );
}

export default ReceiptPage;

async function ReceiptContainer({ params }: { params: Params }) {
  const { patientId, receiptId } = await params;
  const doctor = await getCurrentDoctor();

  if (!doctor) {
    return <div>Doctor not found</div>;
  }

  const [receipt, patient] = await Promise.all([
    fetchAuthQuery(api.receipts.getReceipt, {
      receiptId: receiptId as Id<"receipts">
    }),
    fetchAuthQuery(api.patients.getPatient, {
      patientId: patientId as Id<"patients">
    }),
  ]);

  if (!receipt || !patient) {
    return <div>Receipt or patient not found</div>;
  }

  const headersList = await headers();
  const locale = headersList.get('accept-language');
  const lang = locale?.split(',')[0] || 'en';

  return (
    <Print doctor={doctor} patient={patient} receipt={receipt} lang={lang} />
  );
}
