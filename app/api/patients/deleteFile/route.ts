import { fetchAuthMutation, isAuthenticated } from "@/lib/auth-server";
import { api } from "@/convex/_generated/api";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

export async function POST(req: Request) {
  try {
    const authenticated = await isAuthenticated();
    
    if (!authenticated) {
      return new Response(
        JSON.stringify({
          error: { statusCode: 401, message: 'Not authenticated' }
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { file } = await req.json();

    await fetchAuthMutation(api.files.deleteFile, {
      fileId: file.id,
    });

    // Delete from uploadthing
    const utId = file.url.split("/").pop();
    await utapi.deleteFiles(utId);
    
    return new Response("Delete successful", {
      status: 200
    });
  } catch (error: any) {
    console.error('Error deleting file:', error);
    return new Response(
      JSON.stringify({
        error: { statusCode: 500, message: error?.message || 'File was not deleted' }
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
