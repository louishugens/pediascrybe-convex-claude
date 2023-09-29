import { EnvelopeIcon, MapPinIcon, PhoneIcon } from "@heroicons/react/24/solid";


const PrintHead = ({doctor}) => {
  return ( 
    <div className="flex flex-col items-center py-2 w-full border-b-2 border-black">
      <h3 className=' text-2xl font-bold'><span className=' font-light'>Dr </span>{`${doctor.firstname} ${doctor.lastname}`}</h3>
      <h4 className=' text-xl font-light italic'>{doctor.spec}</h4>
      <p className="font-light text-sm flex flex-row">
        <PhoneIcon className="h-3 w-3 mt-1"/>
        <span>
        : {doctor.phone}, &nbsp; 
        </span>
        <EnvelopeIcon className="h-3 w-3 mt-1"/>
        <span>
        : {doctor.email}
        </span>
      </p>
      {doctor.address && <p className='font-light text-sm flex flex-row'>
        <MapPinIcon className="h-3 w-3 mt-1"/>
        <span>
          : {doctor.address}
        </span>
      </p>}
    </div>
   );
}
 
export default PrintHead;