'use client'
import { useState } from "react";
import { PencilIcon, PrinterIcon, TrashIcon } from "@heroicons/react/24/outline";
import { format } from "date-fns";
import Link from "next/link";
import { BeatLoader } from "react-spinners";
import { useRouter } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";

interface Receipt {
  _id: Id<"receipts">;
  createdAt: number;
  services?: any;
  currency?: string | null;
}

interface Props {
  receipt: Receipt,
  patientId: string
  lang: string
}

interface Service {
  service: string
  price: number
} 

const ReceiptItem = ({receipt, patientId, lang}: Props) => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if(window.confirm('Are you sure you want to delete this receipt?')){
      try{
        setLoading(true)
        const body = {receiptId: receipt._id}
        await fetch('/api/patients/delete-receipt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })

        router.refresh()
      }
      catch(err){
        console.log(err)
      }
      finally {
        setLoading(false)
      }
    }
  }

  const services = receipt.services as unknown as Service[]

  return ( 
    <tr key={receipt._id} className="border-b text-sm font-light w-full bg-slate-50 shadow pt-12 rounded-full border-none border-spacing-x-2">
    <td className="px-4 py-2 rounded-l-full mt-2">{format(receipt.createdAt, 'yyy-MM-dd hh:mm:ss')}</td>
    <td className="px-4 py-2">{services?.[0]?.service}{services?.length > 1 && ", ..."}</td>
    <td className="px-4 py-2">{
      new Intl.NumberFormat(lang, {
        style: 'currency',
        currency: receipt.currency || 'USD'
      }).format(services?.reduce((sum, current) => sum + current.price, 0) || 0)}
    </td>
    <td className="px-4 py-2 rounded-r-full">
      {
        loading
        ?
        <BeatLoader
          color={'#16A349'}
          size={10}
          aria-label="Loading Spinner"
          data-testid="loader"
        />
        :
        <div className="flex flex-row justify-start">
          <Link href={`/user/patients/${patientId}/receipts/${receipt._id}`} className="mr-2">
            <PrinterIcon className="h-4 w-4" />
          </Link>
          <Link href={`/user/patients/${patientId}/receipts/${receipt._id}/edit-receipt`} className="mr-2">
            <PencilIcon className="h-4 w-4" />
          </Link>
          <button onClick={handleDelete}>
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      }
    </td>
  </tr>
   );
}
 
export default ReceiptItem;
