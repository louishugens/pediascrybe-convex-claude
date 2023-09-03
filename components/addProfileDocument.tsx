'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import  BeatLoader  from 'react-spinners/BeatLoader'

export default function AddProfileDocument({patient}) {
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  async function loadProfileDocument() {
    setLoading(true)
 
    try{
      const body = {patient}
      const response = await fetch('/api/patients/addProfileDocument', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const mypatient = await response.json()
      console.log('mypatient :>> ', mypatient);

      router.refresh()
      router.push(`/user/patients/${patient.id}/`)

    }
    catch(err){
      console.log(err)
    }

  }

  return (
    <button
      className="self-end px-4 py-2 bg-muted border border-primary text-muted-foreground rounded-full text-sm"
      onClick={() => loadProfileDocument()}
    >
      {
        loading ? <BeatLoader size={6} color={'#21C55D'} loading={loading} /> :
        "Load to AI"
      }
    </button>
  )
}
