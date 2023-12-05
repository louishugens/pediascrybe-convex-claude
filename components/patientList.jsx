
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"


export default function PatientList({patients, doctorId}) {


  return(
    <>
      {
        patients.length === 0 && (
          <div className="flex flex-col items-start justify-center mt-4">
            <p className="text-sm text-slate-500 italic">No patients found</p>
          </div>
        )
      }
      <div className="grid gap-4 grid-cols-3 mt-4 pb-4">
        {
          patients.map((patient) => (
            <div className="basis-1/3 h-auto  rounded-lg p-4 border border-slate-300 hover:border-green-400 hover:shadow-md" key={patient.id}>
              <p className="text-base  font-semibold text-slate-900">{patient.firstname} {patient.lastname}</p>
              <p className="text-sm font-light text-slate-900 mt-2 mb-4"><span className="font-medium"> 
                {formatDistanceToNow(new Date(patient.birthdate))}</span> hold</p>
              <div className="flex flex-row justify-between mt-6">
                <Link href={`/user/patients/${patient.id}`} className="py-2 px-4 rounded-full bg-muted text-primary text-xs font-medium" >
                  View
                </Link>
                <Link href={`/user/patients/${patient.id}/add-appointment`} className="py-2 px-4 rounded-full bg-primary text-xs text-white font-medium " >
                  Add Appointment
                </Link>
              </div>
            </div>
          ))
        }

      </div>
    </>
  )
  
}