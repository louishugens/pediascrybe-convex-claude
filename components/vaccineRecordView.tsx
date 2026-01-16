import React from 'react'
import { Id } from '@/convex/_generated/dataModel'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { EyeIcon } from 'lucide-react'
import { Syringe, Calendar, Clipboard, User, Factory, Hash, Clock, Droplet, Route, MapPin, List, Eye } from 'lucide-react'
import { numberToOrdinal } from '@/lib/utils'
import { Button } from './ui/button'
import { format } from 'date-fns'
import { ScrollArea } from './ui/scroll-area'

interface VaccineRecordWithDetails {
  _id: Id<"vaccinationRecords">;
  patientId: Id<"patients">;
  date: number;
  manufacturer: string;
  lotNumber: string;
  expiration: number;
  dosage?: string;
  route?: string;
  site?: string;
  notes?: string | null;
  vaccin: {
    _id: Id<"vaccins">;
    name: string;
  } | null;
  dose: {
    _id: Id<"doses">;
    doseType: string;
    doseCount?: number | null;
  } | null;
}

export default function VaccineRecordView({ vaccinationRecord }: { vaccinationRecord: VaccineRecordWithDetails }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {/* <Button variant="ghost" size="icon"> */}
          <EyeIcon className="w-4 h-4 cursor-pointer" />
        {/* </Button> */}
      </DialogTrigger>
      {/* <DialogContent>
        <DialogHeader>
          <DialogTitle>{vaccinationRecord.vaccin.name}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <VaccineDetailItem label="Date Administered" value={vaccinationRecord.date.toLocaleDateString()} />
          <VaccineDetailItem label="Manufacturer" value={vaccinationRecord.manufacturer} />
          <VaccineDetailItem label="Lot Number" value={vaccinationRecord.lotNumber} />
          <VaccineDetailItem label="Expiration Date" value={vaccinationRecord.expiration.toLocaleDateString()} />
          <VaccineDetailItem 
            label="Dose Type" 
            value={vaccinationRecord.dose.doseCount ? numberToOrdinal(vaccinationRecord.dose.doseCount) : ''}
          />
          <VaccineDetailItem label="Dosage" value={vaccinationRecord.dosage} />
          <VaccineDetailItem label="Route" value={vaccinationRecord.route} />
          <VaccineDetailItem label="Site" value={vaccinationRecord.site} />
        </div>
      </DialogContent> */}
      <DialogContent >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{vaccinationRecord.vaccin?.name || 'Unknown Vaccine'}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[80vh] pr-4">
          <div className="space-y-6">
            {/* <div className="flex items-center space-x-4">
              <Syringe className="w-6 h-6 text-blue-500" />
              <div>
                <h3 className="font-semibold">{vaccinName}</h3>
                <p className="text-sm text-muted-foreground">Dose {doseNumber}</p>
              </div>
            </div> */}

            <div className="grid grid-cols-2 gap-4">
              <InfoItem icon={Calendar} iconColor="text-primary" label="Administered Date" value={new Date(vaccinationRecord.date)} />
              {/* <InfoItem icon={User} iconColor="text-blue-500" label="Patient" value={patientName} /> */}
              <InfoItem icon={Factory} iconColor="text-red-500" label="Manufacturer" value={vaccinationRecord.manufacturer} />
              <InfoItem icon={Hash} iconColor="text-black" label="Lot Number" value={vaccinationRecord.lotNumber} />
              <InfoItem icon={Clock} iconColor="text-primary" label="Expiration Date" value={new Date(vaccinationRecord.expiration)} />
              <InfoItem icon={Droplet} iconColor="text-primary" label="Dosage" value={vaccinationRecord.dosage || 'N/A'} />
              <InfoItem icon={Syringe} iconColor="text-red-500" label="Administration Route" value={vaccinationRecord.route || 'N/A'} />
              <InfoItem icon={MapPin} iconColor="text-black" label="Administration Site" value={vaccinationRecord.site || 'N/A'} />
            </div>

            {vaccinationRecord.notes && (
              <div className="pt-4 border-t">
                <div className="flex items-center space-x-2">
                  <Clipboard className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Notes</h3>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{vaccinationRecord.notes}</p>
              </div>
            )}

            {/* <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <List className="w-5 h-5 text-blue-500" />
                  <h3 className="font-semibold">Vaccine ID</h3>
                </div>
                <p className="text-sm text-muted-foreground">{id}</p>
              </div>
            </div> */}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

function InfoItem({ icon: Icon, iconColor, label, value }: { icon: any; iconColor: string; label: string; value: string | Date }) {
  const formattedValue = value instanceof Date && !isNaN(value.getTime())
    ? format(value, 'MMM d, yyyy')
    : String(value);

  return (
    <div className="flex items-center space-x-2">
      <Icon className={`w-5 h-5 ${iconColor}`} />
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{formattedValue}</p>
      </div>
    </div>
  )
}

function VaccineDetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-semibold text-sm text-muted-foreground">{label}</p>
      <p className="mt-1">{value}</p>
    </div>
  )
}
