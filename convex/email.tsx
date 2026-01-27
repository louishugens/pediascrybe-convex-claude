import "./polyfills";
import VerifyEmail from "./emails/verifyEmail";
import MagicLinkEmail from "./emails/magicLink";
import VerifyOTP from "./emails/verifyOTP";
import PediascrybeWelcome from "./emails/welcome";
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