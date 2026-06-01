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

    const { exams, appointmentId, patientId } = await req.json();

    // Translate the form's {exam} shape to the new labOrders {examName} shape.
    const labOrders = Array.isArray(exams)
      ? exams.map((e: { exam?: string; examName?: string; clinicalContext?: string; urgency?: "routine" | "urgent" | "stat"; notes?: string }) => ({
          examName: e.examName ?? e.exam ?? "",
          clinicalContext: e.clinicalContext,
          urgency: e.urgency,
          notes: e.notes,
        }))
      : [];

    // Standalone path: no appointmentId means "create labs for this patient,
    // optionally attached to an appointment we'll pick later". Requires patientId.
    if (!appointmentId) {
      if (!patientId) {
        return new Response(
          JSON.stringify({ error: { statusCode: 400, message: 'patientId required when appointmentId is omitted' } }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      const result = await fetchAuthMutation(api.appointments.createLabOrdersForPatient, {
        patientId,
        items: labOrders,
      });
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const appointment = await fetchAuthMutation(api.appointments.updateAppointment, {
      appointmentId,
      labOrders,
    });

    if (appointment) {
      return new Response(JSON.stringify(appointment), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(
        JSON.stringify({
          error: { statusCode: 500, message: 'Appointment was not updated successfully adding exams' }
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: any) {
    console.error('Error adding exams:', error);
    return new Response(
      JSON.stringify({
        error: { statusCode: 500, message: error?.message || 'An error occurred' }
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
