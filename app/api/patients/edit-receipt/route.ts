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

    const { services, date, currency, patientId, id, cost } = await req.json();

    await fetchAuthMutation(api.receipts.updateReceipt, {
      receiptId: id,
      services: services || undefined,
      date: date ? new Date(date).getTime() : undefined,
      currency: currency || undefined,
      cost: cost || undefined,
    });

    if (id) {
      return NextResponse.json({ _id: id });
    } else {
      return new NextResponse(
        JSON.stringify({
          error: { statusCode: 500, message: 'Receipt was not successfully updated' }
        }),
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error updating receipt:', error);
    return new NextResponse(
      JSON.stringify({
        error: { statusCode: 500, message: error?.message || 'An error occurred' }
      }),
      { status: 500 }
    );
  }
}
