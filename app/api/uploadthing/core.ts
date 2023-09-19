// 'use server'
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

 
const f = createUploadthing();



// const cookieStore = cookies()

const supabase = createRouteHandlerClient({cookies});

async function getSessionId() {

  const { data: {session}, error } = await supabase.auth.getSession();

  if(!session){
    throw new Error("Unauthorized");
  }
  const userId = session?.user?.id;
  return {userId: userId}
}

 
// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {

  // const userId = await getSessionId();

  appointmentFile: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
    pdf: { maxFileSize: "4MB", maxFileCount: 1 }, 
  })
  .middleware(() => getSessionId())
  .onUploadComplete(async ({ metadata, file }) => {
    // This code RUNS ON YOUR SERVER after upload
    console.log("Upload complete for userId:", metadata.userId);

    console.log("file url", file.url);
  }),

} satisfies FileRouter;
 
export type OurFileRouter = typeof ourFileRouter;