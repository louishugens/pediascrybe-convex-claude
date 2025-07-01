import Print from "@/components/printReceipt";
import prisma from "@/utils/prisma";
import { createClient } from '@/utils/supabase/server'
import { headers } from "next/headers";

async function getPatient(patientId: string) {
  const patient = await prisma.patient.findUnique({
    where:{
      id:patientId
    },
  })
  return patient
}

async function getDoctor(doctorId:string) {
  const doctor = await prisma.doctor.findUnique({
    where:{
      id:doctorId
    },
  })
  return doctor
}

async function getReceipt(id:string) {

  const receipt = prisma.receipt.findUnique({
    where:{
      id: id
    }
  })
  return receipt
}

type Params = Promise<{ patientId: string, receiptId: string }>

const ReceiptPage = async (props: { params: Params }) => {
  const params = await props.params;

  const {
    patientId,
    receiptId
  } = params;

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const headersList = await headers()
  const locale = headersList.get('accept-language')
  const lang = locale?.split(',')[0]

  const doctorId = user?.id
  const doctor = await getDoctor(doctorId!)
  const receipt = await getReceipt(receiptId)
  const patient = await getPatient(patientId)


  return ( 
    <>
      <Print doctor={doctor!} patient={patient!} receipt={receipt!} lang={lang!} />
    </>
   );
}
 
export default ReceiptPage;