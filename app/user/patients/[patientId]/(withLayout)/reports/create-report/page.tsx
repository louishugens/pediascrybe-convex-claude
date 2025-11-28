import prisma from "@/utils/prisma";
import CreateReport from "@/components/createReport";
import ReportFormSkeleton from "@/components/skeletons/report-form-skeleton";
import { Suspense, ViewTransition } from "react";
import Link from "next/link";
import { ArrowUturnLeftIcon } from "@heroicons/react/24/outline";

async function getPatient(patientId: string) {
  const patient = await prisma.patient.findUnique({
    where: {
      id: patientId,
    },
  });
  return patient;
}

async function getConsultations(patientId) {
  const consultations = await prisma.appointment.findMany({
    where: {
      patientId: patientId,
    },
  });
  return consultations;
}

type Params = Promise<{ patientId: string }>

const CreateReportPage = async (props: { params: Params }) => {
  const params = await props.params;

  // const {
  //   patientId
  // } = params;

  // const patient = await getPatient(patientId)
  // const consultations = await getConsultations(patientId)


  return (
    <div className='h-full mb-8 mt-4'>
      <div className='flex flex-row w-full h-auto gap-4 justify-end px-4'>
        <Link href={`/user/patients/${params.patientId}/reports`} className='text-black bg-white p-2 rounded-full shadow-sm hover:bg-gray-100 transition-colors'>
          <ArrowUturnLeftIcon className='w-4 h-4' />
        </Link>
      </div>
      <ViewTransition>
        <Suspense fallback={<ReportFormSkeleton />}>
          <CreateReportContainer params={props.params} />
        </Suspense>
      </ViewTransition>
    </div>
  );
}

export default CreateReportPage;

async function CreateReportContainer({ params }: { params: Params }) {
  'use cache'
  const { patientId } = await params;

  const patient = await getPatient(patientId)
  const consultations = await getConsultations(patientId)
  return (
    <CreateReport patientId={patientId} patient={patient} consultations={consultations} />
  )
}