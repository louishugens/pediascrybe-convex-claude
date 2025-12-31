import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { numberToOrdinal } from "@/lib/utils";

interface VaccineRecordWithDetails {
  _id: string;
  date: number;
  notes?: string | null;
  manufacturer: string;
  lotNumber: string;
  expiration: number;
  dosage: string;
  route: string;
  site: string;
  vaccin: {
    _id: string;
    name: string;
  } | null;
  dose: {
    _id: string;
    doseCount?: number | null;
    doseType: string;
  } | null;
}

interface VaccineRecordsPrintProps {
  records: VaccineRecordWithDetails[]
}

export function VaccineRecordsPrint({ records }: VaccineRecordsPrintProps) {
  if (records.length === 0) {
    return null
  }

  return (
    <Table className="text-[10px]">
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Manufacturer</TableHead>
          <TableHead>Lot Number</TableHead>
          <TableHead>Date Administered</TableHead>
          <TableHead>Vaccine Expiration Date</TableHead>
          <TableHead>Dosage</TableHead>
          <TableHead>Dose Type</TableHead>
          <TableHead>Dose Count</TableHead>
          <TableHead>Administration Route</TableHead>
          <TableHead>Administration Site</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.map((record) => (
          <TableRow key={record._id}>
            <TableCell>{record.vaccin?.name || 'N/A'}</TableCell>
            <TableCell>{record.manufacturer}</TableCell>
            <TableCell>{record.lotNumber}</TableCell>
            <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
            <TableCell>{new Date(record.expiration).toLocaleDateString()}</TableCell>
            <TableCell>{record.dosage}</TableCell>
            <TableCell>{record.dose?.doseType ? record.dose.doseType.charAt(0).toUpperCase() + record.dose.doseType.slice(1) : 'N/A'}</TableCell>
            <TableCell>{record.dose?.doseCount ? numberToOrdinal(record.dose.doseCount) : ''}</TableCell>
            <TableCell>{record.route}</TableCell>
            <TableCell>{record.site}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}