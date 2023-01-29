import EditDoctor from "../../../../../components/editDoctor"
import prisma from "../../../../../utils/prisma"

async function getDoctor(doctorId){
  const doctor = await prisma.doctor.findUnique({
    where:{
      id:doctorId
    },
  })
  return doctor
}
const EditProfile = async ({params: {doctorId}}) => {
  const doctor = await getDoctor(doctorId)

  return (
    <div>
      <EditDoctor doctor={doctor} />
    </div>
  )
}

export default EditProfile