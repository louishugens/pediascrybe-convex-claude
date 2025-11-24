ALTER TABLE "Service" ALTER COLUMN "currency" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "Service" ALTER COLUMN "currency" SET DEFAULT 'USD';--> statement-breakpoint
ALTER TABLE "Appointment" DROP COLUMN "currency";--> statement-breakpoint
ALTER TABLE "Appointment" DROP COLUMN "serviceId";--> statement-breakpoint
ALTER TABLE "Service" DROP COLUMN "isDefault";--> statement-breakpoint
DROP TYPE "public"."Currency";