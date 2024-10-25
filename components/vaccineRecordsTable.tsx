import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { VaccinationRecord, Dose, Vaccin } from "@prisma/client"
import { PencilIcon, EyeIcon } from "lucide-react";
import Link from "next/link";
import { deleteVaccinationRecord } from "@/app/actions";
import VaccineRecordDeleteButton from "./vaccineRecordDeleteButton";
import { numberToOrdinal } from "@/lib/utils";
import VaccineRecordView from "./vaccineRecordView";
type VaccineRecordWithDetails = VaccinationRecord & {
  vaccin: Vaccin;
  dose: Dose;
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
          <TableRow key={record.id}>
            <TableCell>{record.vaccin.name}</TableCell>
            <TableCell>{record.manufacturer}</TableCell>
            <TableCell>{record.lotNumber}</TableCell>
            <TableCell>{record.date.toLocaleDateString()}</TableCell>
            <TableCell>{record.expiration.toLocaleDateString()}</TableCell>
            <TableCell>{record.dose.doseType.charAt(0).toUpperCase() + record.dose.doseType.slice(1)}</TableCell>
            <TableCell>{record.dose.doseCount ? numberToOrdinal(record.dose.doseCount) : ''}</TableCell>
            <TableCell>
              <div className="flex flex-row gap-2">
                <VaccineRecordView vaccinationRecord={record} />
                <Link href={`/user/patients/${record.patientId}/vaccines/${record.id}`} className="text-black">
                  <PencilIcon className="w-4 h-4" />
                </Link>
                <VaccineRecordDeleteButton recordId={record.id} patientId={record.patientId} />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}