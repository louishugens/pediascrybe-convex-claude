'use client'
import {useState} from 'react'
import { X, FileIcon, VideoIcon } from 'lucide-react'
import Image from 'next/image'
import { BeatLoader } from 'react-spinners'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'




const UploadedFile = ({file}) => {

  const [loading, setLoading] = useState(false)
  let [color, setColor] = useState("#22C55E")
  const router = useRouter()  

  const deleteFile = async () =>{
    try{
      setLoading(true)
      const body = {file}
      await fetch('/api/patients/deleteFile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        next: { tags: ['file']}
      })
      router.refresh()
      // router.push(`/user/patients/${patientId}/${appointment.id}`) 
    }
    catch(err){
      toast.error(err.message)
    }
  } 

  console.log(file)

return(
  <div  className="flex flex-col items-center">

    {
      file.fileType === 'IMAGE' 
      ?
        <div className="relative h-20 w-20">
          <Image 
            src={file.url}  
            width={100} 
            alt={`${file.name}`} 
            height={100} 
            className="h-20 w-20 rounded-md object-cover" 
          />
          <button
            onClick={deleteFile}
            className="bg-red-500 text-white p-1 rounded-full absolute -top-2 -right-2 shadow-sm"
            type="button"
          >
            <X className="h-3 w-3" />
          </button>

          {
            loading &&
            <div className="absolute top-0 left-0 w-20 h-20 bg-white/70">
              <BeatLoader
                color={color}
                size={8}
                aria-label="Loading Spinner"
                data-testid="loader"
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              />
            </div>
          }
        </div>
      :
      file.fileType === 'VIDEO'
      ?
        <div className="relative h-20 w-20">
          <VideoIcon className="h-20 w-20 fill-muted stroke-primary stroke-1" />
          <button
            onClick={deleteFile}
            className="bg-red-500 text-white p-1 rounded-full absolute -top-2 -right-2 shadow-sm"
            type="button"
          >
            <X className="h-3 w-3" />
          </button>
          {loading && (
            <div className="absolute top-0 left-0 w-20 h-20 bg-white/70">
              <BeatLoader
                color={color}
                size={8}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              />
            </div>
          )}
        </div>
      :
      <>
        <div className="relative h-20 w-20">
          <FileIcon className="h-20 w-20 fill-muted stroke-primary stroke-1" />
          <p className="text-primary text-sm font-bold absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">PDF</p>
          <button
            onClick={deleteFile}
            className="bg-red-500 text-white p-1 rounded-full absolute -top-2 -right-2 shadow-sm"
            type="button"
          >
            <X className="h-3 w-3" />
          </button>
          {
            loading &&
            <div className="absolute top-0 left-0 w-20 h-20 bg-white/70">
              <BeatLoader
                color={color}
                size={8}
                aria-label="Loading Spinner"
                data-testid="loader"
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              />
            </div>
          }
        </div>
      </>
    }
    <a 
      href={file.url}
      target="_blank"
      rel="noopener noreferrer"
      className="ml-2 text-sm text-indigo-500 dark:text-indigo-400 hover:underline"
    >
      {file.name}
    </a>
  </div>  
)
}

export default UploadedFile