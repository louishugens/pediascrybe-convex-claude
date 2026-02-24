/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai from "../ai.js";
import type * as appUsers from "../appUsers.js";
import type * as appointments from "../appointments.js";
import type * as auditLog from "../auditLog.js";
import type * as auth from "../auth.js";
import type * as authHelpers from "../authHelpers.js";
import type * as charts from "../charts.js";
import type * as doctors from "../doctors.js";
import type * as email from "../email.js";
import type * as emails_magicLink from "../emails/magicLink.js";
import type * as emails_portalInvitation from "../emails/portalInvitation.js";
import type * as emails_portalNotification from "../emails/portalNotification.js";
import type * as emails_resetPassword from "../emails/resetPassword.js";
import type * as emails_telehealthNotification from "../emails/telehealthNotification.js";
import type * as emails_verifyEmail from "../emails/verifyEmail.js";
import type * as emails_verifyOTP from "../emails/verifyOTP.js";
import type * as emails_welcome from "../emails/welcome.js";
import type * as files from "../files.js";
import type * as http from "../http.js";
import type * as invitations from "../invitations.js";
import type * as livekit from "../livekit.js";
import type * as patientSubscriptions from "../patientSubscriptions.js";
import type * as patients from "../patients.js";
import type * as portal from "../portal.js";
import type * as portalAi from "../portalAi.js";
import type * as portalNotifications from "../portalNotifications.js";
import type * as receipts from "../receipts.js";
import type * as reports from "../reports.js";
import type * as seed from "../seed.js";
import type * as services from "../services.js";
import type * as stripe from "../stripe.js";
import type * as stripeWebhooks from "../stripeWebhooks.js";
import type * as subscriptions from "../subscriptions.js";
import type * as telehealth from "../telehealth.js";
import type * as telehealthAvailability from "../telehealthAvailability.js";
import type * as telehealthNotifications from "../telehealthNotifications.js";
import type * as usage from "../usage.js";
import type * as vaccines from "../vaccines.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ai: typeof ai;
  appUsers: typeof appUsers;
  appointments: typeof appointments;
  auditLog: typeof auditLog;
  auth: typeof auth;
  authHelpers: typeof authHelpers;
  charts: typeof charts;
  doctors: typeof doctors;
  email: typeof email;
  "emails/magicLink": typeof emails_magicLink;
  "emails/portalInvitation": typeof emails_portalInvitation;
  "emails/portalNotification": typeof emails_portalNotification;
  "emails/resetPassword": typeof emails_resetPassword;
  "emails/telehealthNotification": typeof emails_telehealthNotification;
  "emails/verifyEmail": typeof emails_verifyEmail;
  "emails/verifyOTP": typeof emails_verifyOTP;
  "emails/welcome": typeof emails_welcome;
  files: typeof files;
  http: typeof http;
  invitations: typeof invitations;
  livekit: typeof livekit;
  patientSubscriptions: typeof patientSubscriptions;
  patients: typeof patients;
  portal: typeof portal;
  portalAi: typeof portalAi;
  portalNotifications: typeof portalNotifications;
  receipts: typeof receipts;
  reports: typeof reports;
  seed: typeof seed;
  services: typeof services;
  stripe: typeof stripe;
  stripeWebhooks: typeof stripeWebhooks;
  subscriptions: typeof subscriptions;
  telehealth: typeof telehealth;
  telehealthAvailability: typeof telehealthAvailability;
  telehealthNotifications: typeof telehealthNotifications;
  usage: typeof usage;
  vaccines: typeof vaccines;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  betterAuth: {
    adapter: {
      create: FunctionReference<
        "mutation",
        "internal",
        {
          input:
            | {
                data: {
                  createdAt: number;
                  email: string;
                  emailVerified: boolean;
                  firstName?: null | string;
                  image?: null | string;
                  lastName?: null | string;
                  name: string;
                  role: "patient" | "doctor" | "admin";
                  updatedAt: number;
                  userId?: null | string;
                };
                model: "user";
              }
            | {
                data: {
                  createdAt: number;
                  expiresAt: number;
                  ipAddress?: null | string;
                  token: string;
                  updatedAt: number;
                  userAgent?: null | string;
                  userId: string;
                };
                model: "session";
              }
            | {
                data: {
                  accessToken?: null | string;
                  accessTokenExpiresAt?: null | number;
                  accountId: string;
                  createdAt: number;
                  idToken?: null | string;
                  password?: null | string;
                  providerId: string;
                  refreshToken?: null | string;
                  refreshTokenExpiresAt?: null | number;
                  scope?: null | string;
                  updatedAt: number;
                  userId: string;
                };
                model: "account";
              }
            | {
                data: {
                  createdAt: number;
                  expiresAt: number;
                  identifier: string;
                  updatedAt: number;
                  value: string;
                };
                model: "verification";
              }
            | {
                data: {
                  createdAt: number;
                  expiresAt?: null | number;
                  privateKey: string;
                  publicKey: string;
                };
                model: "jwks";
              };
          onCreateHandle?: string;
          select?: Array<string>;
        },
        any
      >;
      deleteMany: FunctionReference<
        "mutation",
        "internal",
        {
          input:
            | {
                model: "user";
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "name"
                    | "email"
                    | "emailVerified"
                    | "image"
                    | "createdAt"
                    | "updatedAt"
                    | "userId"
                    | "firstName"
                    | "lastName"
                    | "role"
                    | "_id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "not_in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "session";
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "expiresAt"
                    | "token"
                    | "createdAt"
                    | "updatedAt"
                    | "ipAddress"
                    | "userAgent"
                    | "userId"
                    | "_id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "not_in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "account";
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "accountId"
                    | "providerId"
                    | "userId"
                    | "accessToken"
                    | "refreshToken"
                    | "idToken"
                    | "accessTokenExpiresAt"
                    | "refreshTokenExpiresAt"
                    | "scope"
                    | "password"
                    | "createdAt"
                    | "updatedAt"
                    | "_id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "not_in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "verification";
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "identifier"
                    | "value"
                    | "expiresAt"
                    | "createdAt"
                    | "updatedAt"
                    | "_id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "not_in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "jwks";
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "publicKey"
                    | "privateKey"
                    | "createdAt"
                    | "expiresAt"
                    | "_id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "not_in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              };
          onDeleteHandle?: string;
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
        },
        any
      >;
      deleteOne: FunctionReference<
        "mutation",
        "internal",
        {
          input:
            | {
                model: "user";
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "name"
                    | "email"
                    | "emailVerified"
                    | "image"
                    | "createdAt"
                    | "updatedAt"
                    | "userId"
                    | "firstName"
                    | "lastName"
                    | "role"
                    | "_id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "not_in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "session";
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "expiresAt"
                    | "token"
                    | "createdAt"
                    | "updatedAt"
                    | "ipAddress"
                    | "userAgent"
                    | "userId"
                    | "_id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "not_in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "account";
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "accountId"
                    | "providerId"
                    | "userId"
                    | "accessToken"
                    | "refreshToken"
                    | "idToken"
                    | "accessTokenExpiresAt"
                    | "refreshTokenExpiresAt"
                    | "scope"
                    | "password"
                    | "createdAt"
                    | "updatedAt"
                    | "_id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "not_in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "verification";
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "identifier"
                    | "value"
                    | "expiresAt"
                    | "createdAt"
                    | "updatedAt"
                    | "_id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "not_in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "jwks";
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "publicKey"
                    | "privateKey"
                    | "createdAt"
                    | "expiresAt"
                    | "_id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "not_in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              };
          onDeleteHandle?: string;
        },
        any
      >;
      findMany: FunctionReference<
        "query",
        "internal",
        {
          join?: any;
          limit?: number;
          model: "user" | "session" | "account" | "verification" | "jwks";
          offset?: number;
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
          sortBy?: { direction: "asc" | "desc"; field: string };
          where?: Array<{
            connector?: "AND" | "OR";
            field: string;
            operator?:
              | "lt"
              | "lte"
              | "gt"
              | "gte"
              | "eq"
              | "in"
              | "not_in"
              | "ne"
              | "contains"
              | "starts_with"
              | "ends_with";
            value:
              | string
              | number
              | boolean
              | Array<string>
              | Array<number>
              | null;
          }>;
        },
        any
      >;
      findOne: FunctionReference<
        "query",
        "internal",
        {
          join?: any;
          model: "user" | "session" | "account" | "verification" | "jwks";
          select?: Array<string>;
          where?: Array<{
            connector?: "AND" | "OR";
            field: string;
            operator?:
              | "lt"
              | "lte"
              | "gt"
              | "gte"
              | "eq"
              | "in"
              | "not_in"
              | "ne"
              | "contains"
              | "starts_with"
              | "ends_with";
            value:
              | string
              | number
              | boolean
              | Array<string>
              | Array<number>
              | null;
          }>;
        },
        any
      >;
      updateMany: FunctionReference<
        "mutation",
        "internal",
        {
          input:
            | {
                model: "user";
                update: {
                  createdAt?: number;
                  email?: string;
                  emailVerified?: boolean;
                  firstName?: null | string;
                  image?: null | string;
                  lastName?: null | string;
                  name?: string;
                  role?: "patient" | "doctor" | "admin";
                  updatedAt?: number;
                  userId?: null | string;
                };
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "name"
                    | "email"
                    | "emailVerified"
                    | "image"
                    | "createdAt"
                    | "updatedAt"
                    | "userId"
                    | "firstName"
                    | "lastName"
                    | "role"
                    | "_id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "not_in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "session";
                update: {
                  createdAt?: number;
                  expiresAt?: number;
                  ipAddress?: null | string;
                  token?: string;
                  updatedAt?: number;
                  userAgent?: null | string;
                  userId?: string;
                };
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "expiresAt"
                    | "token"
                    | "createdAt"
                    | "updatedAt"
                    | "ipAddress"
                    | "userAgent"
                    | "userId"
                    | "_id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "not_in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "account";
                update: {
                  accessToken?: null | string;
                  accessTokenExpiresAt?: null | number;
                  accountId?: string;
                  createdAt?: number;
                  idToken?: null | string;
                  password?: null | string;
                  providerId?: string;
                  refreshToken?: null | string;
                  refreshTokenExpiresAt?: null | number;
                  scope?: null | string;
                  updatedAt?: number;
                  userId?: string;
                };
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "accountId"
                    | "providerId"
                    | "userId"
                    | "accessToken"
                    | "refreshToken"
                    | "idToken"
                    | "accessTokenExpiresAt"
                    | "refreshTokenExpiresAt"
                    | "scope"
                    | "password"
                    | "createdAt"
                    | "updatedAt"
                    | "_id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "not_in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "verification";
                update: {
                  createdAt?: number;
                  expiresAt?: number;
                  identifier?: string;
                  updatedAt?: number;
                  value?: string;
                };
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "identifier"
                    | "value"
                    | "expiresAt"
                    | "createdAt"
                    | "updatedAt"
                    | "_id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "not_in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "jwks";
                update: {
                  createdAt?: number;
                  expiresAt?: null | number;
                  privateKey?: string;
                  publicKey?: string;
                };
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "publicKey"
                    | "privateKey"
                    | "createdAt"
                    | "expiresAt"
                    | "_id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "not_in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              };
          onUpdateHandle?: string;
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
        },
        any
      >;
      updateOne: FunctionReference<
        "mutation",
        "internal",
        {
          input:
            | {
                model: "user";
                update: {
                  createdAt?: number;
                  email?: string;
                  emailVerified?: boolean;
                  firstName?: null | string;
                  image?: null | string;
                  lastName?: null | string;
                  name?: string;
                  role?: "patient" | "doctor" | "admin";
                  updatedAt?: number;
                  userId?: null | string;
                };
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "name"
                    | "email"
                    | "emailVerified"
                    | "image"
                    | "createdAt"
                    | "updatedAt"
                    | "userId"
                    | "firstName"
                    | "lastName"
                    | "role"
                    | "_id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "not_in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "session";
                update: {
                  createdAt?: number;
                  expiresAt?: number;
                  ipAddress?: null | string;
                  token?: string;
                  updatedAt?: number;
                  userAgent?: null | string;
                  userId?: string;
                };
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "expiresAt"
                    | "token"
                    | "createdAt"
                    | "updatedAt"
                    | "ipAddress"
                    | "userAgent"
                    | "userId"
                    | "_id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "not_in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "account";
                update: {
                  accessToken?: null | string;
                  accessTokenExpiresAt?: null | number;
                  accountId?: string;
                  createdAt?: number;
                  idToken?: null | string;
                  password?: null | string;
                  providerId?: string;
                  refreshToken?: null | string;
                  refreshTokenExpiresAt?: null | number;
                  scope?: null | string;
                  updatedAt?: number;
                  userId?: string;
                };
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "accountId"
                    | "providerId"
                    | "userId"
                    | "accessToken"
                    | "refreshToken"
                    | "idToken"
                    | "accessTokenExpiresAt"
                    | "refreshTokenExpiresAt"
                    | "scope"
                    | "password"
                    | "createdAt"
                    | "updatedAt"
                    | "_id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "not_in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "verification";
                update: {
                  createdAt?: number;
                  expiresAt?: number;
                  identifier?: string;
                  updatedAt?: number;
                  value?: string;
                };
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "identifier"
                    | "value"
                    | "expiresAt"
                    | "createdAt"
                    | "updatedAt"
                    | "_id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "not_in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              }
            | {
                model: "jwks";
                update: {
                  createdAt?: number;
                  expiresAt?: null | number;
                  privateKey?: string;
                  publicKey?: string;
                };
                where?: Array<{
                  connector?: "AND" | "OR";
                  field:
                    | "publicKey"
                    | "privateKey"
                    | "createdAt"
                    | "expiresAt"
                    | "_id";
                  operator?:
                    | "lt"
                    | "lte"
                    | "gt"
                    | "gte"
                    | "eq"
                    | "in"
                    | "not_in"
                    | "ne"
                    | "contains"
                    | "starts_with"
                    | "ends_with";
                  value:
                    | string
                    | number
                    | boolean
                    | Array<string>
                    | Array<number>
                    | null;
                }>;
              };
          onUpdateHandle?: string;
        },
        any
      >;
    };
  };
  resend: {
    lib: {
      cancelEmail: FunctionReference<
        "mutation",
        "internal",
        { emailId: string },
        null
      >;
      cleanupAbandonedEmails: FunctionReference<
        "mutation",
        "internal",
        { olderThan?: number },
        null
      >;
      cleanupOldEmails: FunctionReference<
        "mutation",
        "internal",
        { olderThan?: number },
        null
      >;
      createManualEmail: FunctionReference<
        "mutation",
        "internal",
        {
          from: string;
          headers?: Array<{ name: string; value: string }>;
          replyTo?: Array<string>;
          subject: string;
          to: Array<string> | string;
        },
        string
      >;
      get: FunctionReference<
        "query",
        "internal",
        { emailId: string },
        {
          bcc?: Array<string>;
          bounced?: boolean;
          cc?: Array<string>;
          clicked?: boolean;
          complained: boolean;
          createdAt: number;
          deliveryDelayed?: boolean;
          errorMessage?: string;
          failed?: boolean;
          finalizedAt: number;
          from: string;
          headers?: Array<{ name: string; value: string }>;
          html?: string;
          opened: boolean;
          replyTo: Array<string>;
          resendId?: string;
          segment: number;
          status:
            | "waiting"
            | "queued"
            | "cancelled"
            | "sent"
            | "delivered"
            | "delivery_delayed"
            | "bounced"
            | "failed";
          subject?: string;
          template?: {
            id: string;
            variables?: Record<string, string | number>;
          };
          text?: string;
          to: Array<string>;
        } | null
      >;
      getStatus: FunctionReference<
        "query",
        "internal",
        { emailId: string },
        {
          bounced: boolean;
          clicked: boolean;
          complained: boolean;
          deliveryDelayed: boolean;
          errorMessage: string | null;
          failed: boolean;
          opened: boolean;
          status:
            | "waiting"
            | "queued"
            | "cancelled"
            | "sent"
            | "delivered"
            | "delivery_delayed"
            | "bounced"
            | "failed";
        } | null
      >;
      handleEmailEvent: FunctionReference<
        "mutation",
        "internal",
        { event: any },
        null
      >;
      sendEmail: FunctionReference<
        "mutation",
        "internal",
        {
          bcc?: Array<string>;
          cc?: Array<string>;
          from: string;
          headers?: Array<{ name: string; value: string }>;
          html?: string;
          options: {
            apiKey: string;
            initialBackoffMs: number;
            onEmailEvent?: { fnHandle: string };
            retryAttempts: number;
            testMode: boolean;
          };
          replyTo?: Array<string>;
          subject?: string;
          template?: {
            id: string;
            variables?: Record<string, string | number>;
          };
          text?: string;
          to: Array<string>;
        },
        string
      >;
      updateManualEmail: FunctionReference<
        "mutation",
        "internal",
        {
          emailId: string;
          errorMessage?: string;
          resendId?: string;
          status:
            | "waiting"
            | "queued"
            | "cancelled"
            | "sent"
            | "delivered"
            | "delivery_delayed"
            | "bounced"
            | "failed";
        },
        null
      >;
    };
  };
  stripe: {
    private: {
      handleCheckoutSessionCompleted: FunctionReference<
        "mutation",
        "internal",
        {
          metadata?: any;
          mode: string;
          stripeCheckoutSessionId: string;
          stripeCustomerId?: string;
        },
        null
      >;
      handleCustomerCreated: FunctionReference<
        "mutation",
        "internal",
        {
          email?: string;
          metadata?: any;
          name?: string;
          stripeCustomerId: string;
        },
        null
      >;
      handleCustomerUpdated: FunctionReference<
        "mutation",
        "internal",
        {
          email?: string;
          metadata?: any;
          name?: string;
          stripeCustomerId: string;
        },
        null
      >;
      handleInvoiceCreated: FunctionReference<
        "mutation",
        "internal",
        {
          amountDue: number;
          amountPaid: number;
          created: number;
          status: string;
          stripeCustomerId: string;
          stripeInvoiceId: string;
          stripeSubscriptionId?: string;
        },
        null
      >;
      handleInvoicePaid: FunctionReference<
        "mutation",
        "internal",
        { amountPaid: number; stripeInvoiceId: string },
        null
      >;
      handleInvoicePaymentFailed: FunctionReference<
        "mutation",
        "internal",
        { stripeInvoiceId: string },
        null
      >;
      handlePaymentIntentSucceeded: FunctionReference<
        "mutation",
        "internal",
        {
          amount: number;
          created: number;
          currency: string;
          metadata?: any;
          status: string;
          stripeCustomerId?: string;
          stripePaymentIntentId: string;
        },
        null
      >;
      handleSubscriptionCreated: FunctionReference<
        "mutation",
        "internal",
        {
          cancelAtPeriodEnd: boolean;
          currentPeriodEnd: number;
          metadata?: any;
          priceId: string;
          quantity?: number;
          status: string;
          stripeCustomerId: string;
          stripeSubscriptionId: string;
        },
        null
      >;
      handleSubscriptionDeleted: FunctionReference<
        "mutation",
        "internal",
        { stripeSubscriptionId: string },
        null
      >;
      handleSubscriptionUpdated: FunctionReference<
        "mutation",
        "internal",
        {
          cancelAtPeriodEnd: boolean;
          currentPeriodEnd: number;
          metadata?: any;
          quantity?: number;
          status: string;
          stripeSubscriptionId: string;
        },
        null
      >;
      updatePaymentCustomer: FunctionReference<
        "mutation",
        "internal",
        { stripeCustomerId: string; stripePaymentIntentId: string },
        null
      >;
      updateSubscriptionQuantityInternal: FunctionReference<
        "mutation",
        "internal",
        { quantity: number; stripeSubscriptionId: string },
        null
      >;
    };
    public: {
      createOrUpdateCustomer: FunctionReference<
        "mutation",
        "internal",
        {
          email?: string;
          metadata?: any;
          name?: string;
          stripeCustomerId: string;
        },
        string
      >;
      getCustomer: FunctionReference<
        "query",
        "internal",
        { stripeCustomerId: string },
        {
          email?: string;
          metadata?: any;
          name?: string;
          stripeCustomerId: string;
        } | null
      >;
      getPayment: FunctionReference<
        "query",
        "internal",
        { stripePaymentIntentId: string },
        {
          amount: number;
          created: number;
          currency: string;
          metadata?: any;
          orgId?: string;
          status: string;
          stripeCustomerId?: string;
          stripePaymentIntentId: string;
          userId?: string;
        } | null
      >;
      getSubscription: FunctionReference<
        "query",
        "internal",
        { stripeSubscriptionId: string },
        {
          cancelAtPeriodEnd: boolean;
          currentPeriodEnd: number;
          metadata?: any;
          orgId?: string;
          priceId: string;
          quantity?: number;
          status: string;
          stripeCustomerId: string;
          stripeSubscriptionId: string;
          userId?: string;
        } | null
      >;
      getSubscriptionByOrgId: FunctionReference<
        "query",
        "internal",
        { orgId: string },
        {
          cancelAtPeriodEnd: boolean;
          currentPeriodEnd: number;
          metadata?: any;
          orgId?: string;
          priceId: string;
          quantity?: number;
          status: string;
          stripeCustomerId: string;
          stripeSubscriptionId: string;
          userId?: string;
        } | null
      >;
      listInvoices: FunctionReference<
        "query",
        "internal",
        { stripeCustomerId: string },
        Array<{
          amountDue: number;
          amountPaid: number;
          created: number;
          orgId?: string;
          status: string;
          stripeCustomerId: string;
          stripeInvoiceId: string;
          stripeSubscriptionId?: string;
          userId?: string;
        }>
      >;
      listInvoicesByOrgId: FunctionReference<
        "query",
        "internal",
        { orgId: string },
        Array<{
          amountDue: number;
          amountPaid: number;
          created: number;
          orgId?: string;
          status: string;
          stripeCustomerId: string;
          stripeInvoiceId: string;
          stripeSubscriptionId?: string;
          userId?: string;
        }>
      >;
      listInvoicesByUserId: FunctionReference<
        "query",
        "internal",
        { userId: string },
        Array<{
          amountDue: number;
          amountPaid: number;
          created: number;
          orgId?: string;
          status: string;
          stripeCustomerId: string;
          stripeInvoiceId: string;
          stripeSubscriptionId?: string;
          userId?: string;
        }>
      >;
      listPayments: FunctionReference<
        "query",
        "internal",
        { stripeCustomerId: string },
        Array<{
          amount: number;
          created: number;
          currency: string;
          metadata?: any;
          orgId?: string;
          status: string;
          stripeCustomerId?: string;
          stripePaymentIntentId: string;
          userId?: string;
        }>
      >;
      listPaymentsByOrgId: FunctionReference<
        "query",
        "internal",
        { orgId: string },
        Array<{
          amount: number;
          created: number;
          currency: string;
          metadata?: any;
          orgId?: string;
          status: string;
          stripeCustomerId?: string;
          stripePaymentIntentId: string;
          userId?: string;
        }>
      >;
      listPaymentsByUserId: FunctionReference<
        "query",
        "internal",
        { userId: string },
        Array<{
          amount: number;
          created: number;
          currency: string;
          metadata?: any;
          orgId?: string;
          status: string;
          stripeCustomerId?: string;
          stripePaymentIntentId: string;
          userId?: string;
        }>
      >;
      listSubscriptions: FunctionReference<
        "query",
        "internal",
        { stripeCustomerId: string },
        Array<{
          cancelAtPeriodEnd: boolean;
          currentPeriodEnd: number;
          metadata?: any;
          orgId?: string;
          priceId: string;
          quantity?: number;
          status: string;
          stripeCustomerId: string;
          stripeSubscriptionId: string;
          userId?: string;
        }>
      >;
      listSubscriptionsByUserId: FunctionReference<
        "query",
        "internal",
        { userId: string },
        Array<{
          cancelAtPeriodEnd: boolean;
          currentPeriodEnd: number;
          metadata?: any;
          orgId?: string;
          priceId: string;
          quantity?: number;
          status: string;
          stripeCustomerId: string;
          stripeSubscriptionId: string;
          userId?: string;
        }>
      >;
      updateSubscriptionMetadata: FunctionReference<
        "mutation",
        "internal",
        {
          metadata: any;
          orgId?: string;
          stripeSubscriptionId: string;
          userId?: string;
        },
        null
      >;
      updateSubscriptionQuantity: FunctionReference<
        "action",
        "internal",
        { apiKey: string; quantity: number; stripeSubscriptionId: string },
        null
      >;
    };
  };
};
