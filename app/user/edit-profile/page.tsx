import EditDoctor from "@/components/editDoctor"
import { createClient } from '@/utils/supabase/server'
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getDoctorById } from "@/data/queries";

const EditProfile = async () => {

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditProfileContainer />
    </Suspense>
  )
}

export default EditProfile

async function EditProfileContainer() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const doctorId = user?.id

  if (!doctorId) {
    redirect('/')
  }

  const doctor = await getDoctorById(doctorId)

  if (!doctor) {
    redirect('/')
  }
  return (
    <EditDoctor doctor={doctor} />
  )
}