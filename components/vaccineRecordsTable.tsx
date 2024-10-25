import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { VaccinationRecord, Dose, Vaccin } from "@prisma/client"
import { Button } from "./ui/button";
import { TrashIcon } from "lucide-react";
import { deleteVaccinationRecord } from "@/app/actions";
import VaccineRecordDeleteButton from "./vaccineRecordDeleteButton";
import { numberToOrdinal } from "@/lib/utils";
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
          <TableHead>Date</TableHead>
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
            <TableCell>{record.dose.doseType.charAt(0).toUpperCase() + record.dose.doseType.slice(1)}</TableCell>
            <TableCell>{record.dose.doseCount ? numberToOrdinal(record.dose.doseCount) : ''}</TableCell>
            <TableCell>
              <VaccineRecordDeleteButton recordId={record.id} patientId={record.patientId} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}