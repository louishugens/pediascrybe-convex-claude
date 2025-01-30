
import toast, { Toaster } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { X, FileIcon } from 'lucide-react';
import Image from 'next/image';

import { UploadDropzone } from "@/lib/uploadthing"

import "@uploadthing/react/styles.css"
import { url } from 'inspector';

const videoMimeTypes = {
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  avi: 'video/x-msvideo',
  webm: 'video/webm'
} as const;

interface FileUploadProps {
  endpoint: "appointmentFile",
  value: string,
  onChange: (url?: string) => void,
}
export default function FileUpoad({endpoint, value,  onChange}: FileUploadProps) {
  const extension = value?.split('.').pop()?.toLowerCase();
  const isPDF = extension === 'pdf';
  const isVideo = ['mp4', 'mov', 'avi', 'webm'].includes(extension || '');
  const fileType = isPDF ? 'PDF' : isVideo ? 'VIDEO' : 'IMAGE';

  console.log(fileType)

  // const router = useRouter()

  // const saveFile = async (url: string|undefined, fileType: string, appointmentId: string|undefined) => {
  //   const res = await fetch(`/api/patients/saveFile`, {
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/json',
  //     },
  //     body: JSON.stringify({
  //       url,
  //       fileType,
  //       appointmentId
  //     }),
  //   })
  //   const data = await res.json()
  //   if(data){
  //     toast.success("File saved!", {
  //       icon: '👏',
  //     })
  //     router.push(`/user/patients/${patientId}/${appointmentId}/`)
  //   }
  // }

  if (value && fileType !== "PDF") {
    return (
      <div className="relative h-48 w-full">
        {fileType === 'IMAGE' ? (
          <Image
            fill
            src={value}
            alt="Upload"
            className="rounded-md object-cover"
          />
        ) : (
          <video
            controls
            className="w-full h-full rounded-md object-contain"
            playsInline
            preload="metadata"
          >
            <source 
              src={value} 
              type={videoMimeTypes[extension as keyof typeof videoMimeTypes]} 
            />
            Your browser does not support the video tag.
          </video>
        )}
        <button
          onClick={() => onChange("")}
          className="bg-red-500 text-white p-1 rounded-full absolute -top-2 -right-2 shadow-sm"
          type="button"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    )
  }

  if (value && fileType === "PDF") {
    return (
      <div className="relative flex items-center p-2 mt-2 rounded-md bg-background/10">
        <FileIcon className="h-10 w-10 fill-muted stroke-primary" />
        <a 
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-2 text-sm text-indigo-500 dark:text-indigo-400 hover:underline"
        >
          {value}
        </a>
        <button
          onClick={() => onChange("")}
          className="bg-red-500 text-white p-1 rounded-full absolute -top-2 -right-2 shadow-sm"
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <>
    <UploadDropzone
      endpoint={endpoint}
      className="w-full h-full mb-4"
      onClientUploadComplete={(res) => {
        console.log('res :>> ', res);
        onChange(res?.[0].url);
        // saveFile(res?.[0].url, fileType, appointmentId)
        toast.success("File uploaded successfully", {
          icon: '👏',
        })
      }}
      onUploadError={(err: Error) => {
        toast.error(`Error: ${err.message}`)
        console.log(err)
      }}
    />
    <Toaster />
    </>
  )
}