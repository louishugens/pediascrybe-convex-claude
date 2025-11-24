import { db } from "@/db";
import { Appointment } from "@/db/schema";
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
      const { height, weight, head, motif, findings, arm, sao2, temperature, pulse, respiratory, systolic, diastolic, otherRemarks, doctorId, patientId, serviceId, cost } = await req.json()

      const appointmentData: any = {
        height, weight, head, motif, findings, arm, sao2, temperature, pulse, respiratory, systolic, diastolic, otherRemarks, doctorId, patientId
      }

      // Include serviceId if provided
      if (serviceId) {
        appointmentData.serviceId = serviceId
      }
      if (cost) {
        appointmentData.cost = cost
      }

      const [appointment] = await db.insert(Appointment).values(appointmentData).returning()

      if (!appointment) {
        return new Response(
          JSON.stringify({
            error: { statusCode: 500, message: 'Failed to create appointment' }
          }),
          { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      return new Response(JSON.stringify(appointment), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error: any) {
      console.error('Error creating appointment:', error);
      return new Response(
        JSON.stringify({
          error: { 
            statusCode: 500, 
            message: error?.message || 'Failed to create appointment',
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