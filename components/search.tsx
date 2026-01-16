'use client'
import { useRouter } from "next/navigation"
import { SearchIcon } from 'lucide-react'
export default function Search() {
  const router = useRouter()
  return (
    <div className="relative flex flex-col justify-center items-center py-4 w-1/2">
      <span className="absolute inset-y-0 left-2 top-0 flex items-center pl-1">
        <SearchIcon className="w-4 h-4 text-slate-400" />
      </span>
      <input 
        type="search" 
        onChange={(e) => router.push(`?search=${e.target.value}`)}
        placeholder="Search for patients"
        className="w-full h-10 pl-8 px-4 border border-slate-400 rounded-full shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm placeholder:italic placeholder:text-sm placeholder:text-slate-400"
      />
    </div>
  )
}
