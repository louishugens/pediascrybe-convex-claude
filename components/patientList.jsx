
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"


export default function PatientList({patients, doctorId}) {


  return(
    <div className="grid gap-4 grid-cols-3 mt-4">
      {
        patients.map((patient) => (
          <div className="basis-1/3 h-auto shadow-md rounded-lg p-4" key={patient.id}>
            <p className="text-lg  font-bold text-slate-900">{patient.firstname} {patient.lastname}</p>
            <p className="text-sm font-light text-slate-900"><span className="font-medium"> 
              {formatDistanceToNow(new Date(patient.birthdate))}</span> hold</p>
            <div className="flex flex-row justify-between mt-4">
              <Link href={`/user_only/${doctorId}/patients/${patient.id}`} className="py-2 px-4 rounded-full bg-green-500 text-sm font-light" >
                View
              </Link>
              <Link href='#' className="py-2 px-4 rounded-full bg-green-500 text-sm font-light" >
                Add Appointment
              </Link>
            </div>

          </div>
        ))
      }

    </div>
  )
  
}