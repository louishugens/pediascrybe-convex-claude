CREATE TYPE "public"."Currency" AS ENUM('HTG', 'USD');--> statement-breakpoint
CREATE TYPE "public"."DoseType" AS ENUM('regular', 'annual', 'booster', 'unique');--> statement-breakpoint
CREATE TYPE "public"."FileType" AS ENUM('IMAGE', 'PDF', 'VIDEO');--> statement-breakpoint
CREATE TYPE "public"."Pricing_plan_interval" AS ENUM('day', 'week', 'month', 'year');--> statement-breakpoint
CREATE TYPE "public"."Pricing_type" AS ENUM('one_time', 'recurring');--> statement-breakpoint
CREATE TYPE "public"."ReportType" AS ENUM('Report', 'Certificate', 'ReferenceNote');--> statement-breakpoint
CREATE TYPE "public"."Sex" AS ENUM('male', 'female');--> statement-breakpoint
CREATE TYPE "public"."Status" AS ENUM('pending', 'paid', 'offline');--> statement-breakpoint
CREATE TYPE "public"."Subscription_status" AS ENUM('trialing', 'active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'unpaid', 'paused');--> statement-breakpoint
CREATE TYPE "public"."VaccineManufacturer" AS ENUM('Pfizer', 'Moderna', 'JohnsonAndJohnson', 'AstraZeneca', 'Sanofi', 'GlaxoSmithKline', 'Merck', 'Novavax', 'Sinovac', 'Sinopharm', 'BharatBiotech', 'SerumInstituteOfIndia');--> statement-breakpoint
CREATE TABLE "Appointment" (
	"startDate" timestamp (3) DEFAULT now() NOT NULL,
	"endDate" timestamp (3),
	"cost" integer,
	"currency" "Currency",
	"serviceId" text,
	"motif" text,
	"transactionDate" timestamp (3),
	"transactionId" text,
	"findings" text,
	"recommendation" text,
	"otherRemarks" text,
	"doctorId" text,
	"id" text PRIMARY KEY DEFAULT cuid() NOT NULL,
	"patientId" text,
	"status" "Status" DEFAULT 'offline',
	"head" double precision,
	"height" double precision,
	"weight" double precision,
	"exams" jsonb,
	"medication" jsonb,
	"arm" double precision,
	"sao2" double precision,
	"temperature" double precision,
	"pulse" integer,
	"respiratory" integer,
	"systolic" double precision,
	"diastolic" double precision,
	"vectorId" integer,
	"files" text[] NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Doctor" (
	"cost" integer,
	"duration" integer,
	"phone" text,
	"address" text,
	"experience" integer,
	"isActive" boolean NOT NULL,
	"isCompleted" boolean NOT NULL,
	"isDoctor" boolean NOT NULL,
	"isMedPro" boolean NOT NULL,
	"spec" text,
	"summary" text,
	"title" text,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL,
	"availability" jsonb,
	"id" text PRIMARY KEY DEFAULT cuid() NOT NULL,
	"email" text NOT NULL,
	"firstname" text NOT NULL,
	"lastname" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Dose" (
	"id" text PRIMARY KEY DEFAULT cuid() NOT NULL,
	"doseCount" integer,
	"maxAge" integer,
	"doseType" "DoseType" NOT NULL,
	"vaccinId" text
);
--> statement-breakpoint
CREATE TABLE "File" (
	"id" text PRIMARY KEY DEFAULT cuid() NOT NULL,
	"url" text NOT NULL,
	"name" text NOT NULL,
	"fileType" "FileType" NOT NULL,
	"appointmentId" text NOT NULL,
	CONSTRAINT "File_url_unique" UNIQUE("url")
);
--> statement-breakpoint
CREATE TABLE "Img" (
	"url" text NOT NULL,
	"public_id" text NOT NULL,
	"doctorId" text,
	"id" text PRIMARY KEY NOT NULL,
	CONSTRAINT "Img_doctorId_unique" UNIQUE("doctorId")
);
--> statement-breakpoint
CREATE TABLE "Patient" (
	"firstname" text NOT NULL,
	"lastname" text NOT NULL,
	"email" text,
	"isCompleted" boolean NOT NULL,
	"phone" text,
	"profession" text,
	"religion" text,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL,
	"id" text PRIMARY KEY DEFAULT cuid() NOT NULL,
	"doctorId" text,
	"birthdate" timestamp (3) NOT NULL,
	"mothername" text,
	"sex" "Sex",
	"children" integer,
	"allergies" text,
	"history" text,
	"bloodtype" text,
	"electrophoresis" text,
	"vectorId" integer
);
--> statement-breakpoint
CREATE TABLE "Price" (
	"id" text PRIMARY KEY NOT NULL,
	"active" boolean,
	"description" text,
	"unit_amount" integer,
	"currency" text,
	"pricing_type" "Pricing_type",
	"interval" "Pricing_plan_interval",
	"interval_count" integer,
	"trial_period_days" integer,
	"metadata" jsonb,
	"productId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Product" (
	"id" text PRIMARY KEY NOT NULL,
	"active" boolean,
	"name" text,
	"description" text,
	"image" text,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "Receipt" (
	"id" text PRIMARY KEY DEFAULT cuid() NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"services" jsonb,
	"cost" double precision,
	"date" timestamp (3),
	"currency" text,
	"patientId" text
);
--> statement-breakpoint
CREATE TABLE "Report" (
	"id" text PRIMARY KEY DEFAULT cuid() NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"reportType" "ReportType" NOT NULL,
	"content" text NOT NULL,
	"patientId" text
);
--> statement-breakpoint
CREATE TABLE "Service" (
	"id" text PRIMARY KEY DEFAULT cuid() NOT NULL,
	"name" text NOT NULL,
	"price" double precision NOT NULL,
	"currency" "Currency" DEFAULT 'HTG' NOT NULL,
	"doctorId" text NOT NULL,
	"isDefault" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Subscription" (
	"id" text PRIMARY KEY NOT NULL,
	"status" "Subscription_status" NOT NULL,
	"metadata" jsonb,
	"quantity" integer,
	"cancel_at_period_end" boolean,
	"created" timestamp (3) DEFAULT now() NOT NULL,
	"current_period_start" timestamp (3) DEFAULT now() NOT NULL,
	"current_period_end" timestamp (3) DEFAULT now() NOT NULL,
	"ended_at" timestamp (3) DEFAULT now(),
	"cancel_at" timestamp (3) DEFAULT now(),
	"canceled_at" timestamp (3) DEFAULT now(),
	"trial_start" timestamp (3) DEFAULT now(),
	"trial_end" timestamp (3) DEFAULT now(),
	"doctorId" text,
	"priceId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Vaccin" (
	"id" text PRIMARY KEY DEFAULT cuid() NOT NULL,
	"name" text NOT NULL,
	"doctorId" text
);
--> statement-breakpoint
CREATE TABLE "VaccinReference" (
	"id" text PRIMARY KEY DEFAULT cuid() NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "VaccinReferenceDose" (
	"id" text PRIMARY KEY DEFAULT cuid() NOT NULL,
	"doseCount" integer,
	"maxAge" integer,
	"doseType" "DoseType" NOT NULL,
	"vaccinReferenceId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "VaccinationRecord" (
	"id" text PRIMARY KEY DEFAULT cuid() NOT NULL,
	"date" timestamp (3) NOT NULL,
	"notes" text,
	"patientId" text NOT NULL,
	"vaccinId" text NOT NULL,
	"manufacturer" text NOT NULL,
	"lotNumber" text NOT NULL,
	"expiration" timestamp (3) NOT NULL,
	"dosage" text NOT NULL,
	"route" text NOT NULL,
	"site" text NOT NULL,
	"doseId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "charts" (
	"id" text PRIMARY KEY NOT NULL,
	"p03" jsonb NOT NULL,
	"p15" jsonb NOT NULL,
	"p50" jsonb NOT NULL,
	"p85" jsonb NOT NULL,
	"p97" jsonb NOT NULL,
	"height" jsonb
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" bigint PRIMARY KEY NOT NULL,
	"content" text,
	"metadata" jsonb
);
--> statement-breakpoint
ALTER TABLE "File" ADD CONSTRAINT "File_appointment_fkey" FOREIGN KEY ("appointmentId") REFERENCES "public"."Appointment"("id") ON DELETE cascade ON UPDATE cascade;