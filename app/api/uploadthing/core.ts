import { createUploadthing, type FileRouter } from "uploadthing/next";
import { isAuthenticated } from '@/lib/auth-server';

const f = createUploadthing();

async function getSessionId() {
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    throw new Error("Unauthorized");
  }

  // For uploadthing, we just need to verify the user is authenticated
  // The actual user ID will be handled by the mutation when saving the file
  return { userId: "authenticated" };
}

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
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
