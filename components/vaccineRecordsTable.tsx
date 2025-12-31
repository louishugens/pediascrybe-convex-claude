import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PencilIcon } from "lucide-react";
import Link from "next/link";
import VaccineRecordDeleteButton from "./vaccineRecordDeleteButton";
import { numberToOrdinal } from "@/lib/utils";
import VaccineRecordView from "./vaccineRecordView";
import { Id } from "@/convex/_generated/dataModel";

interface Vaccin {
  _id: Id<"vaccins">;
  name: string;
}

interface Dose {
  _id: Id<"doses">;
  doseType: string;
  doseCount?: number | null;
}

interface VaccineRecordWithDetails {
  _id: Id<"vaccinationRecords">;
  patientId: Id<"patients">;
  date: number;
  manufacturer: string;
  lotNumber: string;
  expiration: number;
  vaccin: Vaccin | null;
  dose: Dose | null;
}

interface VaccineRecordsTableProps {
  records: VaccineRecordWithDetails[]
}

export function VaccineRecordsTable({ records }: VaccineRecordsTableProps) {
  if (records.length === 0) {
    return null
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Manufacturer</TableHead>
          <TableHead>Lot Number</TableHead>
          <TableHead>Date Administered</TableHead>
          <TableHead>Vaccine Expiration Date</TableHead>
          <TableHead>Dose Type</TableHead>
          <TableHead>Dose Count</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.map((record) => (
          <TableRow key={record._id}>
            <TableCell>{record.vaccin?.name}</TableCell>
            <TableCell>{record.manufacturer}</TableCell>
            <TableCell>{record.lotNumber}</TableCell>
            <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
            <TableCell>{new Date(record.expiration).toLocaleDateString()}</TableCell>
            <TableCell>{record.dose?.doseType ? record.dose.doseType.charAt(0).toUpperCase() + record.dose.doseType.slice(1) : ''}</TableCell>
            <TableCell>{record.dose?.doseCount ? numberToOrdinal(record.dose.doseCount) : ''}</TableCell>
            <TableCell>
              <div className="flex flex-row gap-2">
                <VaccineRecordView vaccinationRecord={record} />
                <Link href={`/user/patients/${record.patientId}/vaccines/${record._id}`} className="text-black">
                  <PencilIcon className="w-4 h-4" />
                </Link>
                <VaccineRecordDeleteButton recordId={record._id} patientId={record.patientId} />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
