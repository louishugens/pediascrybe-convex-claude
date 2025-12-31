import { createClient, type GenericCtx, type AuthFunctions } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { components, internal } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { betterAuth, type BetterAuthOptions } from "better-auth/minimal";
import authConfig from "./auth.config";
import { requireActionCtx } from "@convex-dev/better-auth/utils";
import { sendEmailVerification, sendResetPassword } from "./email";
import authSchema from "./betterAuth/schema"; 

const siteUrl = process.env.SITE_URL!;

const authFunctions: AuthFunctions = internal.auth;

// The component client has methods needed for integrating Convex with Better Auth,
// as well as helper methods for general use.
export const authComponent = createClient<DataModel, typeof authSchema>( 
  components.betterAuth,
  {
    local: {
      schema: authSchema,
    },
    authFunctions,
    triggers: {
      user: {
        onCreate: async (ctx, doc) => {
          const now = Date.now();
          
          // Create appUser record
          await ctx.db.insert("appUsers", {
            authUserId: String(doc._id),
            role: doc.role,
            plan: "free",
            firstName: doc.firstName ?? undefined,
            lastName: doc.lastName ?? undefined,
            displayName: doc.name,
            email: doc.email,
          });

          // If user is a doctor, create doctor profile
          if (doc.role === "doctor") {
            await ctx.db.insert("doctors", {
              authUserId: String(doc._id),
              email: doc.email,
              firstname: doc.firstName ?? doc.name?.split(" ")[0] ?? "",
              lastname: doc.lastName ?? doc.name?.split(" ").slice(1).join(" ") ?? "",
              isActive: true,
              isCompleted: false,
              isDoctor: true,
              isMedPro: true,
              createdAt: now,
              updatedAt: now,
            });
          }

          // Schedule Stripe customer creation
          // await ctx.scheduler.runAfter(0, internal.stripe.createStripeCustomer, {
          //   userId: String(doc._id),
          //   email: doc.email,
          //   name: doc.name ?? undefined,
          // });
        },
      },
    },
  },
);

export const { onCreate, onUpdate, onDelete } = authComponent.triggersApi();

export const createAuthOptions = (ctx: GenericCtx<DataModel>) => {
  return {
    baseURL: siteUrl,
    database: authComponent.adapter(ctx),
    // Custom user fields for signup
    user: {
      additionalFields: {
        firstName: {
          type: "string",
          required: false,
        },
        lastName: {
          type: "string",
          required: false,
        },
        role: {
          type: ["patient", "doctor", "admin"],
          required: true,
          defaultValue: "patient",
        },
      },
    },
    // Configure simple, non-verified email/password to get started
    emailVerification: {
      sendVerificationEmail: async ({ user, url }) => {
        await sendEmailVerification(requireActionCtx(ctx), {
          to: user.email,
          url,
        });
      },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      sendResetPassword: async ({ user, url }) => {
        await sendResetPassword(requireActionCtx(ctx), {
          to: user.email,
          url,
        });
      },
    },
    plugins: [
      convex({ authConfig }),
    ],
  } satisfies BetterAuthOptions;
};

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth(createAuthOptions(ctx));
};

export const { getAuthUser } = authComponent.clientApi();

// Example function for getting the current user
// Feel free to edit, omit, etc.
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return authComponent.getAuthUser(ctx);
  },
});