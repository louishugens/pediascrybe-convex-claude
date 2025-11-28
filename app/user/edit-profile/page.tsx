import EditDoctor from "@/components/editDoctor"
import { createClient } from '@/utils/supabase/server'
import { redirect } from "next/navigation";
import { Suspense, ViewTransition } from "react";
import GenericFormSkeleton from "@/components/skeletons/generic-form-skeleton";
import { getDoctorById } from "@/data/queries";

const EditProfile = async () => {

  return (
    <ViewTransition>
      <Suspense fallback={<GenericFormSkeleton />}>
        <EditProfileContainer />
      </Suspense>
    </ViewTransition>
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