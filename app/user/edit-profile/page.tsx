import EditDoctor from "@/components/editDoctor"
import { redirect } from "next/navigation";
import { Suspense, ViewTransition } from "react";
import GenericFormSkeleton from "@/components/skeletons/generic-form-skeleton";
import { getCurrentDoctor } from "@/lib/convex-data";

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
  const doctor = await getCurrentDoctor();

  if (!doctor) {
    redirect('/');
  }

  return (
    <EditDoctor doctor={doctor} />
  )
}
