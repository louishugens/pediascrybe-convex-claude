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

    const { reportType, content, patientId, id } = await req.json();

    await fetchAuthMutation(api.reports.updateReport, {
      reportId: id,
      reportType: reportType || undefined,
      content: content || undefined,
    });

    // Return the report ID (update returns null, but we already have the ID from the request)
    return NextResponse.json({ _id: id });
  } catch (error: any) {
    console.error('Error updating report:', error);
    return new NextResponse(
      JSON.stringify({
        error: { statusCode: 500, message: error?.message || 'An error occurred' }
      }),
      { status: 500 }
    );
  }
}
