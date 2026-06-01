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

    const { prescriptions, appointmentId, patientId } = await req.json();

    if (!appointmentId) {
      if (!patientId) {
        return new Response(
          JSON.stringify({ error: { statusCode: 400, message: 'patientId required when appointmentId is omitted' } }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      const result = await fetchAuthMutation(api.appointments.createPrescriptionsForPatient, {
        patientId,
        items: prescriptions,
      });
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const appointment = await fetchAuthMutation(api.appointments.updateAppointment, {
      appointmentId,
      prescriptions,
    });

    if (appointment) {
      return new Response(JSON.stringify(appointment), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(
        JSON.stringify({
          error: { statusCode: 500, message: 'Appointment was not updated successfully adding prescriptions' }
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: any) {
    console.error('Error adding prescriptions:', error);
    return new Response(
      JSON.stringify({
        error: { statusCode: 500, message: error?.message || 'An error occurred' }
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
