// 'use server'
import { createUploadthing, type FileRouter } from "uploadthing/next";
// import { createRouteHandlerClient, createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { createClient } from '@/utils/supabase/server'

 
const f = createUploadthing();


async function getSessionId() {
  const supabase = await createClient()

  const { data: {session}, error } = await (await supabase).auth.getSession();

  if(!session){
    throw new Error("Unauthorized");
  }
  const userId = session?.user?.id;
  console.log('userId :>> ', userId);
  return {userId: userId}
}
 
 
// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {

  // const userId = await getSessionId();

  appointmentFile: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
    pdf: { maxFileSize: "4MB", maxFileCount: 1 }, 
    video: { maxFileSize: "32MB", maxFileCount: 1 },
  })
  .middleware(() => getSessionId())
  .onUploadComplete(async ({ metadata, file }) => {
    // This code RUNS ON YOUR SERVER after upload
    console.log("Upload complete for userId:", metadata.userId);

    console.log("file url", file.url);
  }),

} satisfies FileRouter;
 
export type OurFileRouter = typeof ourFileRouter;