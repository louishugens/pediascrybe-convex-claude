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

    const { firstname, lastname, email, phone, spec, address, id } = await req.json();

    const doctor = await fetchAuthMutation(api.doctors.updateDoctor, {
      doctorId: id,
      firstname: firstname || undefined,
      lastname: lastname || undefined,
      email: email || undefined,
      phone: phone || undefined,
      spec: spec || undefined,
      address: address || undefined,
    });

    if (doctor) {
      return new Response(JSON.stringify(doctor), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(
        JSON.stringify({
          error: { statusCode: 500, message: 'Doctor profile was not updated successfully' }
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: any) {
    console.error('Error updating doctor:', error);
    return new Response(
      JSON.stringify({
        error: { statusCode: 500, message: error?.message || 'An error occurred' }
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
