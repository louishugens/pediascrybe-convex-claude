import "./polyfills";
import VerifyEmail from "./emails/verifyEmail";
import MagicLinkEmail from "./emails/magicLink";
import VerifyOTP from "./emails/verifyOTP";
import PediascrybeWelcome from "./emails/welcome";
import PortalInvitation from "./emails/portalInvitation";
import PortalNotification from "./emails/portalNotification";
import TelehealthNotification from "./emails/telehealthNotification";
import { render } from "@react-email/components";
import ResetPasswordEmail from "./emails/resetPassword";
import { components } from "./_generated/api";
import { Resend } from "@convex-dev/resend";
import { type ActionCtx, internalAction } from "./_generated/server";
import { v } from "convex/values";

export const resend = new Resend(components.resend, {
  testMode: false,
});

export const sendEmailVerification = async (
  ctx: ActionCtx,
  {
    to,
    url,
  }: {
    to: string;
    url: string;
  },
) => {
  await resend.sendEmail(ctx, {
    from: "Pediascrybe <info@email.pediascrybe.com>",
    to,
    subject: "Verify your email address",
    html: await render(<VerifyEmail url={url} />),
  });
};

export const sendOTPVerification = async (
  ctx: ActionCtx,
  {
    to,
    code,
  }: {
    to: string;     
    code: string;
  },
) => {
  await resend.sendEmail(ctx, {
    from: "Pediascrybe <info@email.pediascrybe.com>",
    to,
    subject: "Verify your email address",
    html: await render(<VerifyOTP code={code} />),
  });
};

export const sendMagicLink = async (
  ctx: ActionCtx,
  {
    to,
    url,
  }: {
    to: string;
    url: string;
  },
) => {
  await resend.sendEmail(ctx, {
    from: "Pediascrybe <info@email.pediascrybe.com>",
    to,
    subject: "Sign in to your account",
    html: await render(<MagicLinkEmail url={url} />),
  });
};

export const sendResetPassword = async (
  ctx: ActionCtx,
  {
    to,
    url,
  }: {
    to: string;
    url: string;
  },
) => {
  await resend.sendEmail(ctx, {
    from: "Pediascrybe <info@email.pediascrybe.com>",
    to,
    subject: "Reset your password",
    html: await render(<ResetPasswordEmail url={url} />),
  });
};

export const sendWelcomeEmail = async (
  ctx: ActionCtx,
  {
    to,
    userName,
  }: {
    to: string;
    userName?: string;
  },
) => {
  await resend.sendEmail(ctx, {
    from: "Pediascrybe <info@email.pediascrybe.com>",
    to,
    bcc: ['louishugens@gmail.com'],
    subject: "Welcome to Pediascrybe - Transforming Pediatric Care!",
    html: await render(<PediascrybeWelcome userName={userName} />),
  });
};

// Internal action for scheduling welcome email from mutations
export const sendWelcomeEmailAction = internalAction({
  args: {
    to: v.string(),
    userName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await sendWelcomeEmail(ctx, {
      to: args.to,
      userName: args.userName,
    });
  },
});

// Portal invitation email
export const sendPortalInvitationEmail = async (
  ctx: ActionCtx,
  {
    to,
    doctorName,
    childName,
    inviteUrl,
  }: {
    to: string;
    doctorName: string;
    childName: string;
    inviteUrl: string;
  },
) => {
  await resend.sendEmail(ctx, {
    from: "Pediascrybe <info@email.pediascrybe.com>",
    to,
    subject: `You're invited to view ${childName}'s health records`,
    html: await render(<PortalInvitation doctorName={doctorName} childName={childName} inviteUrl={inviteUrl} />),
  });
};

// Internal action for scheduling portal invitation email
export const sendPortalInvitationAction = internalAction({
  args: {
    to: v.string(),
    doctorName: v.string(),
    childName: v.string(),
    inviteUrl: v.string(),
  },
  handler: async (ctx, args) => {
    await sendPortalInvitationEmail(ctx, {
      to: args.to,
      doctorName: args.doctorName,
      childName: args.childName,
      inviteUrl: args.inviteUrl,
    });
  },
});

// Portal notification email
export const sendPortalNotificationEmail = async (
  ctx: ActionCtx,
  {
    to,
    parentName,
    childName,
    doctorName,
    notificationType,
    message,
    portalUrl,
  }: {
    to: string;
    parentName?: string;
    childName: string;
    doctorName: string;
    notificationType:
      | "new_prescription"
      | "new_lab_exam"
      | "appointment_summary"
      | "new_vaccine_record"
      | "new_report"
      | "prescription_discontinued"
      | "lab_result_available";
    message: string;
    portalUrl: string;
  },
) => {
  const SUBJECT_MAP = {
    new_prescription: `New prescription for ${childName}`,
    new_lab_exam: `New lab exam request for ${childName}`,
    appointment_summary: `Appointment summary for ${childName}`,
    new_vaccine_record: `Vaccination update for ${childName}`,
    new_report: `New report for ${childName}`,
    prescription_discontinued: `Medication discontinued for ${childName}`,
    lab_result_available: `Lab results available for ${childName}`,
  };

  await resend.sendEmail(ctx, {
    from: "Pediascrybe <info@email.pediascrybe.com>",
    to,
    subject: SUBJECT_MAP[notificationType],
    html: await render(
      <PortalNotification
        parentName={parentName}
        childName={childName}
        doctorName={doctorName}
        notificationType={notificationType}
        message={message}
        portalUrl={portalUrl}
      />
    ),
  });
};

// Internal action for scheduling portal notification email
export const sendPortalNotificationAction = internalAction({
  args: {
    to: v.string(),
    parentName: v.optional(v.string()),
    childName: v.string(),
    doctorName: v.string(),
    notificationType: v.union(
      v.literal("new_prescription"),
      v.literal("new_lab_exam"),
      v.literal("appointment_summary"),
      v.literal("new_vaccine_record"),
      v.literal("new_report"),
      v.literal("prescription_discontinued"),
      v.literal("lab_result_available")
    ),
    message: v.string(),
    portalUrl: v.string(),
  },
  handler: async (ctx, args) => {
    await sendPortalNotificationEmail(ctx, {
      to: args.to,
      parentName: args.parentName,
      childName: args.childName,
      doctorName: args.doctorName,
      notificationType: args.notificationType,
      message: args.message,
      portalUrl: args.portalUrl,
    });
  },
});

// ==================== Telehealth Emails ====================

export const sendTelehealthNotificationEmail = async (
  ctx: ActionCtx,
  {
    to,
    parentName,
    doctorName,
    childName,
    type,
    message,
    portalUrl,
  }: {
    to: string;
    parentName?: string;
    doctorName?: string;
    childName: string;
    type: "telehealth_booking_request" | "telehealth_confirmed" | "telehealth_rescheduled" | "telehealth_cancelled" | "telehealth_reminder";
    message: string;
    portalUrl: string;
  },
) => {
  const SUBJECT_MAP = {
    telehealth_booking_request: `New telehealth appointment request for ${childName}`,
    telehealth_confirmed: `Telehealth appointment confirmed for ${childName}`,
    telehealth_rescheduled: `Telehealth appointment rescheduled for ${childName}`,
    telehealth_cancelled: `Telehealth appointment cancelled for ${childName}`,
    telehealth_reminder: `Telehealth appointment reminder for ${childName}`,
  };

  await resend.sendEmail(ctx, {
    from: "Pediascrybe <info@email.pediascrybe.com>",
    to,
    subject: SUBJECT_MAP[type],
    html: await render(
      <TelehealthNotification
        parentName={parentName}
        doctorName={doctorName}
        childName={childName}
        type={type}
        message={message}
        portalUrl={portalUrl}
      />
    ),
  });
};

// Internal action for scheduling telehealth notification email
export const sendTelehealthNotificationAction = internalAction({
  args: {
    to: v.string(),
    parentName: v.optional(v.string()),
    doctorName: v.optional(v.string()),
    childName: v.string(),
    type: v.union(
      v.literal("telehealth_booking_request"),
      v.literal("telehealth_confirmed"),
      v.literal("telehealth_rescheduled"),
      v.literal("telehealth_cancelled"),
      v.literal("telehealth_reminder")
    ),
    message: v.string(),
    portalUrl: v.string(),
  },
  handler: async (ctx, args) => {
    await sendTelehealthNotificationEmail(ctx, {
      to: args.to,
      parentName: args.parentName,
      doctorName: args.doctorName,
      childName: args.childName,
      type: args.type,
      message: args.message,
      portalUrl: args.portalUrl,
    });
  },
});