import { db } from "@/db";
import { Appointment } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  if(req.method == 'POST') {

    const supabase = await createClient()


    const { data: {user}, error } = await (await supabase).auth.getUser();


    if (!user) {
      return new Response(
        JSON.stringify({
          error: { statusCode: 500, message: 'User is not defined' }
        }),
        { status: 500 }
      );
    }

    try {
      const {height, weight, head, motif, findings, otherRemarks, arm, sao2, temperature, pulse, respiratory, systolic, diastolic, appointmentId, serviceId}  = await req.json()

      const updateData: any = {
        height, weight, head, motif, findings, otherRemarks, arm, sao2, temperature, pulse, respiratory, systolic, diastolic, serviceId
      }



      const [appointment] = await db.update(Appointment)
        .set(updateData)
        .where(eq(Appointment.id, appointmentId))
        .returning()

      if (!appointment) {
        return new Response(
          JSON.stringify({
            error: { statusCode: 404, message: 'Appointment not found' }
          }),
          { 
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      return new Response(JSON.stringify(appointment), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error: any) {
      console.error('Error updating appointment:', error);
      return new Response(
        JSON.stringify({
          error: { 
            statusCode: 500, 
            message: error?.message || 'Failed to update appointment',
            details: error?.meta || null
          }
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

  }

}