import EditDoctor from "@/components/editDoctor"
import { redirect } from "next/navigation";
import { Suspense, ViewTransition } from "react";
import GenericFormSkeleton from "@/components/skeletons/generic-form-skeleton";
import { getCurrentDoctor } from "@/lib/convex-data";
import { headers } from "next/headers";

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

  // Detect timezone from Vercel geolocation header (IP-based)
  const headersList = await headers();
  const detectedTimezone = headersList.get("x-vercel-ip-timezone") || undefined;

  return (
    <EditDoctor doctor={doctor} detectedTimezone={detectedTimezone} />
  )
}
