'use client'
import { useRouter } from "next/navigation"
export default function Search() {
  const router = useRouter()
  return (
    <div className="flex flex-col justify-center items-center py-4">
      <input 
        type="search" 
        onChange={(e) => router.push(`?search=${e.target.value}`)}
        placeholder="Search for patients"
        className="w-1/2 py-2 px-4 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm placeholder:italic placeholder:text-sm placeholder:text-slate-400"
      />
    </div>
  )
}
