'use client'
import { useState } from "react";
import { PencilIcon, PrinterIcon, TrashIcon } from "@heroicons/react/24/outline";
import { format } from "date-fns";
import Link from "next/link";
import { BeatLoader } from "react-spinners";
import { useRouter } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";

interface Report {
  _id: Id<"reports">;
  createdAt: number;
  reportType: string;
}

interface Props {
  report: Report,
  patientId: string
}

const ReportItem = ({report, patientId}: Props) => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if(window.confirm('Are you sure you want to delete this report?')){
      try{
        setLoading(true)
        const body = {reportId: report._id}
        await fetch('/api/patients/delete-report', {
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

  return ( 
    <tr key={report._id} className="border-b text-sm font-light w-full bg-slate-50 shadow pt-12 rounded-full border-none border-spacing-x-2">
    <td className="px-4 py-2 rounded-l-full mt-2">{format(report.createdAt, 'yyy-MM-dd hh:mm:ss')}</td>
    <td className="px-4 py-2">{report.reportType === 'ReferenceNote' ? 'Reference Note' : report.reportType}</td>
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
          <Link href={`/user/patients/${patientId}/reports/${report._id}`} className="mr-2">
            <PrinterIcon className="h-4 w-4" />
          </Link>
          <Link href={`/user/patients/${patientId}/reports/${report._id}/edit-report`} className="mr-2">
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
 
export default ReportItem;
