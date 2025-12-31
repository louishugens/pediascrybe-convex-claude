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

    const { reportType, content, patientId } = await req.json();

    const reportId = await fetchAuthMutation(api.reports.createReport, {
      patientId,
      reportType,
      content,
    });

    if (reportId) {
      return NextResponse.json({ _id: reportId });
    } else {
      return new NextResponse(
        JSON.stringify({
          error: { statusCode: 500, message: 'Report was not successfully created' }
        }),
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error creating report:', error);
    return new NextResponse(
      JSON.stringify({
        error: { statusCode: 500, message: error?.message || 'An error occurred' }
      }),
      { status: 500 }
    );
  }
}
