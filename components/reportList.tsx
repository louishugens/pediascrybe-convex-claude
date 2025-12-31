'use client'
import ReportItem from "./reportItem";
import { Id } from "@/convex/_generated/dataModel";

interface Report {
  _id: Id<"reports">;
  createdAt: number;
  reportType: string;
}

interface Props {
  reports: Report[]
  patientId: string
}

const ReportList = ({reports, patientId}: Props) => {
  return ( 
    <table className="table-auto color-0 rounded-lg relative text-sm w-full mt-4 border-separate border-spacing-y-1.5">
    <thead className="rounded-t-lg  bg-blue-50">
      <tr className="rounded-full shadow">
        <th className="text-left px-4 py-2 rounded-l-full">Date</th>
        <th className="text-left px-4 py-2">Report Type</th>
        <th className="text-left px-4 py-2 rounded-r-full">Actions</th>
      </tr>
    </thead>
    <tbody className='w-full'>
      {reports.map(report => {
        return(
          <ReportItem patientId={patientId} report={report} key={report._id} />
        )}
      )}
    </tbody>
  </table>
   );
}
 
export default ReportList;
