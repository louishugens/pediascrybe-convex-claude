import { fetchAuthMutation, isAuthenticated } from "@/lib/auth-server";
import { checkBotId } from 'botid/server';
import { api } from "@/convex/_generated/api";

export async function POST(req: Request) {
  try {
    // Bot protection check
    const verification = await checkBotId();
    if (verification.isBot) {
      return new Response(
        JSON.stringify({ error: { statusCode: 403, message: 'Access denied' } }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

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
      firstname, lastname, email, birthdate, birthWeight, mothername, sex, religion,
      phone, doctorId, allergies, history, bloodtype, electrophoresis
    } = await req.json();

    const patient = await fetchAuthMutation(api.patients.createPatient, {
      doctorId,
      firstname,
      lastname,
      email: email || undefined,
      birthdate: new Date(birthdate).getTime(),
      birthWeight: typeof birthWeight === "number" && Number.isFinite(birthWeight) ? birthWeight : undefined,
      mothername: mothername || undefined,
      sex: sex || undefined,
      religion: religion || undefined,
      phone: phone || undefined,
      allergies: allergies || undefined,
      history: history || undefined,
      bloodtype: bloodtype || undefined,
      electrophoresis: electrophoresis || undefined,
    });

    if (patient) {
      // Patient created successfully
      return new Response(JSON.stringify(patient), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(
        JSON.stringify({
          error: { statusCode: 500, message: 'Patient was not created' }
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: any) {
    console.error('Error creating patient:', error);
    return new Response(
      JSON.stringify({
        error: { statusCode: 500, message: error?.message || 'An error occurred' }
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
