import { fetchAuthMutation, isAuthenticated } from "@/lib/auth-server";
import { api } from "@/convex/_generated/api";
import { NextResponse } from "next/server";

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

    const { reportId } = await req.json();

    await fetchAuthMutation(api.reports.deleteReport, {
      reportId,
    });
    
    return new NextResponse("Delete successful", {
      status: 200
    });
  } catch (error: any) {
    console.error('Error deleting report:', error);
    return new NextResponse(
      JSON.stringify({
        error: { statusCode: 500, message: error?.message || 'Report not deleted' }
      }),
      { status: 500 }
    );
  }
}
