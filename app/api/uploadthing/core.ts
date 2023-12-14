// 'use server'
import { createUploadthing, type FileRouter } from "uploadthing/next";
// import { createRouteHandlerClient, createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
// import supabase from "@/utils/supabase-ssr";
import { createServerClient, type CookieOptions } from '@supabase/ssr'

 
const f = createUploadthing();


async function getSessionId() {
  // 'use server'

  // const supabase = createServerComponentClient({cookies});
  // const supabase = createRouteHandlerClient({cookies});
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  const { data: {session}, error } = await supabase.auth.getSession();

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
  })
  .middleware(() => getSessionId())
  .onUploadComplete(async ({ metadata, file }) => {
    // This code RUNS ON YOUR SERVER after upload
    console.log("Upload complete for userId:", metadata.userId);

    console.log("file url", file.url);
  }),

} satisfies FileRouter;
 
export type OurFileRouter = typeof ourFileRouter;