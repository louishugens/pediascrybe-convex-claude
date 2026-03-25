import { streamText, convertToModelMessages, UIMessage, tool, stepCountIs } from "ai";
import { getModel } from "@/lib/ai/providers";
import {
  isAuthenticated,
  fetchAuthQuery,
  fetchAuthMutation,
} from "@/lib/auth-server";
import { aiRateLimit, checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { z } from "zod";
import { getTodayRange, getWeekRange } from "@/convex/timezone";

export const maxDuration = 60;

export async function POST(req: Request) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const ip = await getClientIp();
  const rateLimitResponse = await checkRateLimit(aiRateLimit, ip);
  if (rateLimitResponse) return rateLimitResponse;

  // Get doctor profile
  const doctor = await fetchAuthQuery(api.doctors.getDoctor, {});
  if (!doctor) {
    return new Response(JSON.stringify({ error: "Doctor profile not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const doctorId = doctor._id as Id<"doctors">;
  const doctorName = `Dr. ${doctor.lastname}`;
  const doctorTimezone = (doctor as any).timezone as string | undefined;

  const { messages }: { messages: UIMessage[] } = await req.json();
  const modelMessages = await convertToModelMessages(messages);

  const systemPrompt = `You are ScrybeGPT, an AI medical assistant for ${doctorName} on Pediascrybe (a pediatric EMR).

You help with:
- Patient lookups and summaries
- Schedule management (today's appointments, this week's schedule)
- Clinical support (differential diagnosis, medication suggestions)
- Revenue and analytics
- Vaccine tracking
- Creating patients and appointments

IMPORTANT RULES:
1. Always call searchPatients before answering about a specific patient
2. When creating records (patients, appointments), show a preview and ask for confirmation
3. For medication suggestions, always check allergies and weight-based dosing
4. Be concise but thorough in clinical contexts
5. Respond in the same language the doctor uses (French, English, or Creole)
6. Format responses with markdown for readability
7. Never fabricate patient data — only use what the tools return`;

  const tools = {
    searchPatients: tool({
      description:
        "Search patients by name. Use this when the doctor mentions a patient.",
      inputSchema: z.object({
        query: z.string().describe("Patient name to search for"),
      }),
      execute: async ({ query }) => {
        const results = await fetchAuthQuery(api.patients.listWithSearch, {
          doctorId,
          search: query,
        });
        return results.slice(0, 10).map((p: any) => ({
          id: p._id,
          name: `${p.firstname} ${p.lastname}`,
          birthdate: p.birthdate,
          sex: p.sex,
          allergies: p.allergies,
          phone: p.phone,
        }));
      },
    }),

    getPatientDetails: tool({
      description:
        "Get full details for a patient including recent appointments.",
      inputSchema: z.object({
        patientId: z.string().describe("The patient ID"),
      }),
      execute: async ({ patientId }) => {
        const data = await fetchAuthQuery(api.patients.getWithAppointments, {
          patientId: patientId as Id<"patients">,
        });
        if (!data) return { error: "Patient not found" };
        const { appointments, ...patient } = data as any;
        return {
          name: `${patient.firstname} ${patient.lastname}`,
          birthdate: patient.birthdate,
          sex: patient.sex,
          allergies: patient.allergies,
          weight: patient.weight,
          height: patient.height,
          head: patient.head,
          phone: patient.phone,
          email: patient.email,
          recentAppointments: (appointments || []).slice(0, 5).map((a: any) => ({
            date: a.startDate,
            motif: a.motif,
            status: a.status,
            diagnostics: a.diagnostics,
            medications: a.medications,
          })),
        };
      },
    }),

    getTodaySchedule: tool({
      description: "Get today's appointments for the doctor.",
      inputSchema: z.object({}),
      execute: async () => {
        const appointments = await fetchAuthQuery(api.appointments.listToday, {
          doctorId,
        });
        return appointments.map((a: any) => ({
          id: a._id,
          time: a.startDate,
          patientId: a.patientId,
          motif: a.motif,
          status: a.status,
        }));
      },
    }),

    getWeekSchedule: tool({
      description: "Get this week's appointments.",
      inputSchema: z.object({}),
      execute: async () => {
        const appointments = await fetchAuthQuery(
          api.appointments.listByDoctor,
          { doctorId }
        );
        const { startOfWeek, endOfWeek } = getWeekRange(doctorTimezone);

        return appointments
          .filter(
            (a: any) => a.startDate >= startOfWeek && a.startDate < endOfWeek
          )
          .map((a: any) => ({
            id: a._id,
            time: a.startDate,
            patientId: a.patientId,
            motif: a.motif,
            status: a.status,
          }));
      },
    }),

    getTodayRevenue: tool({
      description: "Get today's revenue summary.",
      inputSchema: z.object({}),
      execute: async () => {
        return await fetchAuthQuery(api.appointments.getTodayRevenue, {
          doctorId,
        });
      },
    }),

    getMonthlyRevenue: tool({
      description: "Get monthly revenue data.",
      inputSchema: z.object({}),
      execute: async () => {
        return await fetchAuthQuery(api.appointments.getMonthlyRevenue, {
          doctorId,
        });
      },
    }),

    getVaccineRecords: tool({
      description:
        "Get vaccination records for a patient to check what vaccines are due.",
      inputSchema: z.object({
        patientId: z.string().describe("The patient ID"),
      }),
      execute: async ({ patientId }) => {
        return await fetchAuthQuery(api.vaccines.getPatientRecords, {
          patientId: patientId as Id<"patients">,
        });
      },
    }),

    getPatientCount: tool({
      description: "Get total number of patients.",
      inputSchema: z.object({}),
      execute: async () => {
        return await fetchAuthQuery(api.patients.count, { doctorId });
      },
    }),

    createPatient: tool({
      description:
        "Create a new patient. Always show a preview and ask for confirmation before calling this.",
      inputSchema: z.object({
        firstname: z.string(),
        lastname: z.string(),
        birthdate: z
          .number()
          .describe("Birthdate as Unix timestamp in milliseconds"),
        sex: z.enum(["male", "female"]).optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        mothername: z.string().optional(),
      }),
      execute: async (params) => {
        const result = await fetchAuthMutation(api.patients.create, {
          ...params,
          doctorId,
        });
        return { success: true, patientId: result };
      },
    }),
  };

  const result = streamText({
    ...getModel("balanced"),
    system: systemPrompt,
    messages: modelMessages,
    tools,
    stopWhen: stepCountIs(8),
  });

  return result.toUIMessageStreamResponse();
}
