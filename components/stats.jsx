import Link from "next/link"

export default function Stats({patients}) {

  const count = patients.length

  return(
    <div className="grid gap-4 grid-cols-2 mt-4">
    <div className="h-auto shadow-md rounded-lg p-4 bg-slate-900">
      <p className="text-2xl  font-bold text-green-500 ">Patients</p>
      <div className="flex justify-center">
        <div className="center bg-slate-800 h-40 w-40 rounded-full relative">
          <p className="text-4xl text-white font-semibold absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">{count}</p>
        </div>
      </div>
    </div>
    <div className="h-auto shadow-md rounded-lg p-4 bg-blue-500">
      <p className="text-2xl  font-bold text-slate-900 ">Appointments</p>
      <div className="flex justify-center">
        <div className="center bg-blue-100/20 h-40 w-40 rounded-full relative">
          <p className="text-4xl text-white font-semibold absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">50</p>
        </div>
      </div>
    </div>

    </div>
  )
  
}