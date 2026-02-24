import { MutationCtx } from "./_generated/server";

type AuditAction =
  | "patient.create" | "patient.update" | "patient.delete"
  | "appointment.create" | "appointment.update" | "appointment.delete"
  | "vaccine.create" | "vaccine.update"
  | "report.create" | "report.update" | "report.delete"
  | "receipt.create" | "receipt.update" | "receipt.delete"
  | "file.create" | "file.delete"
  | "invitation.create" | "invitation.accept"
  | "portal.file_upload"
  | "telehealth.book" | "telehealth.confirm" | "telehealth.cancel" | "telehealth.join"
  | "subscription.change" | "doctor.update";

type AuditRole = "patient" | "doctor" | "admin" | "system";

/**
 * Log an audit event for HIPAA compliance.
 *
 * Call this in mutations that touch patient data.
 * Does NOT include PHI in the log — only record IDs and action types.
 */
export async function logAudit(
  ctx: MutationCtx,
  params: {
    actorAuthUserId: string;
    actorRole: AuditRole;
    action: AuditAction;
    entityType: string;
    entityId: string;
    details?: string;
  }
) {
  await ctx.db.insert("auditLogs", {
    ...params,
    timestamp: Date.now(),
  });
}
