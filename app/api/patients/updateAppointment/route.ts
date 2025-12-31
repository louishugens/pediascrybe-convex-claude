import { fetchAuthMutation, isAuthenticated } from "@/lib/auth-server";
import { api } from "@/convex/_generated/api";

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

    const { 
      height, weight, head, motif, findings, otherRemarks, arm, sao2, 
      temperature, pulse, respiratory, systolic, diastolic, 
      appointmentId, serviceId, cost 
    } = await req.json();

    const appointment = await fetchAuthMutation(api.appointments.updateAppointment, {
      appointmentId,
      serviceId: serviceId || undefined,
      cost: cost || undefined,
      motif: motif || undefined,
      findings: findings || undefined,
      otherRemarks: otherRemarks || undefined,
      height: height || undefined,
      weight: weight || undefined,
      head: head || undefined,
      arm: arm || undefined,
      sao2: sao2 || undefined,
      temperature: temperature || undefined,
      pulse: pulse || undefined,
      respiratory: respiratory || undefined,
      systolic: systolic || undefined,
      diastolic: diastolic || undefined,
    });

    if (!appointment) {
      return new Response(
        JSON.stringify({
          error: { statusCode: 404, message: 'Appointment not found' }
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
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
          message: error?.message || 'Failed to update appointment'
        }
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
