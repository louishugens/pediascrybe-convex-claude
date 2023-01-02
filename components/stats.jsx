import Link from "next/link"

export default function Stats({patients}) {

  const count = patients.length

  return(
    <div className="grid gap-4 grid-cols-2 mt-4">
    <div className="h-auto shadow-md rounded-lg p-4 bg-slate-900">
      <p className="text-2xl  font-bold text-green-500 ">Patients</p>
      <div className="flex justify-center">
        <div className="text-6xl text-white center bg-slate-800 p-12 font-bold rounded-full">{count}</div>
      </div>
    </div>
    <div className="h-auto shadow-md rounded-lg p-4 bg-blue-500">
      <p className="text-2xl  font-bold text-slate-900 ">Appointments</p>
      <div className="flex justify-center">
        <div className="text-6xl text-white center bg-blue-100/20 p-12 font-bold rounded-full">50</div>
      </div>
    </div>

    </div>
  )
  
}