import Print from "@/components/printReceipt";
import prisma from "@/utils/prisma";
import {createServerClient} from '@/utils/supabase-server'
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

const ReceiptPage = async ({params:{patientId, receiptId}}) => {
  const supabase = createServerClient()
  
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const headersList = headers()
  const locale = headersList.get('accept-language')
  const lang = locale?.split(',')[0]

  const doctorId = session?.user?.id
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