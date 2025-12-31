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

    const { receiptId } = await req.json();

    await fetchAuthMutation(api.receipts.deleteReceipt, {
      receiptId,
    });
    
    return new NextResponse("Delete successful", {
      status: 200
    });
  } catch (error: any) {
    console.error('Error deleting receipt:', error);
    return new NextResponse(
      JSON.stringify({
        error: { statusCode: 500, message: error?.message || 'Receipt not deleted' }
      }),
      { status: 500 }
    );
  }
}
