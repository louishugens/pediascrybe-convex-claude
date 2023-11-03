'use client'
import { useState } from "react";
import { PencilIcon, PrinterIcon, TrashIcon } from "@heroicons/react/24/outline";
import { format } from "date-fns";
import Link from "next/link";
import { BeatLoader } from "react-spinners";
import { Receipt } from "@prisma/client";
import { useRouter  } from "next/navigation";

interface Props {
  receipt: Receipt,
  patientId: String
}
const ReceiptItem = ({receipt, patientId}: Props) => {
  const router = useRouter()

  const [loading, setLoading] = useState(false)

  const handleDelete = async () =>{
    if(window.confirm('Are you sure you want to delete appointment?')){
      try{
        setLoading(true)
        const body = {receiptId: receipt.id}
        await fetch('/api/patients/delete-receipt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          next:{
            tags:['receipts']
          }
        })

        router.refresh()
        // router.push(`/user/patients/${patientId}`)
      }
      catch(err){
        console.log(err)
      }
    }
  }

  return ( 
    <tr key={receipt.id} className="border-b text-sm font-light w-full bg-slate-50 shadow pt-12 rounded-full border-none border-spacing-x-2">
    <td className="px-4 py-2 rounded-l-full mt-2">{format(receipt.createdAt, 'yyy-MM-dd hh:mm:ss')}</td>
    <td className="px-4 py-2">{receipt.service}</td>
    <td className="px-4 py-2">{receipt.cost}</td>
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
          <Link href={`/user/patients/${patientId}/receipts/${receipt.id}`} className="mr-2">
            <PrinterIcon className="h-4 w-4" />
          </Link>
          <Link href={`/user/patients/${patientId}/receipts/${receipt.id}/edit-receipt`} className="mr-2">
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