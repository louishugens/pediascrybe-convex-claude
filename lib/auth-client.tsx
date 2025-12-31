"use client"

import { createAuthClient } from "better-auth/react";
import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { useRouter } from "next/navigation";
import { PropsWithChildren } from "react";
import { api } from "@/convex/_generated/api";
import { isAuthError } from "./utils";
import { AuthBoundary } from "@convex-dev/better-auth/react";


export const authClient = createAuthClient({
  plugins: [
    convexClient(),
    inferAdditionalFields({
      user: {
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
    }),
  ],
});

export const ClientAuthBoundary = ({ children }: PropsWithChildren) => {
  const router = useRouter();
  return (
    <AuthBoundary
      authClient={authClient}
      onUnauth={() => router.push("/")}
      getAuthUserFn={api.auth.getAuthUser}
      isAuthError={isAuthError}
    >
      {children}
    </AuthBoundary>
  );
};