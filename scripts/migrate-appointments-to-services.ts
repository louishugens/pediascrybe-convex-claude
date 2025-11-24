/**
 * Migration Script: Link Appointments to Consultation Services
 * 
 * This script:
 * 1. Creates a "Consultation" service (500 HTG) for each doctor if it doesn't exist
 * 2. Links all existing appointments to their doctor's Consultation service
 * 3. Logs appointments without doctorId to a file for manual handling
 * 
 * This script is idempotent - safe to run multiple times.
 */

import { db } from '@/db'
import { Doctor, Service, Appointment, Patient } from '@/db/schema'
import { eq, and, isNull, isNotNull, sql } from 'drizzle-orm'
import { writeFile } from 'fs/promises'
import { join } from 'path'

interface AppointmentWithoutDoctor {
	id: string
	patientId: string | null
	startDate: Date
	cost: number | null
}

async function migrateAppointmentsToServices() {
	console.log('🚀 Starting migration: Linking appointments to Consultation services...\n')

	try {
		// Step 1: Get all doctors
		console.log('📋 Fetching all doctors...')
		const doctors = await db.select().from(Doctor)
		console.log(`   Found ${doctors.length} doctors\n`)

		if (doctors.length === 0) {
			console.log('⚠️  No doctors found. Exiting.')
			return
		}

		// Step 2: Create Consultation service for each doctor (if it doesn't exist)
		console.log('🔧 Creating Consultation services for doctors...')
		const consultationServices = new Map<string, string>() // doctorId -> serviceId

		for (const doctor of doctors) {
			// Check if Consultation service already exists for this doctor
			const existingServices = await db
				.select()
				.from(Service)
				.where(and(
					eq(Service.doctorId, doctor.id),
					eq(Service.name, 'Consultation')
				))
			const existingService = existingServices[0]

			if (existingService) {
				console.log(`   ✓ Doctor ${doctor.firstname} ${doctor.lastname} already has Consultation service`)
				consultationServices.set(doctor.id, existingService.id)
			} else {
				// Create Consultation service
				const [newService] = await db.insert(Service).values({
					name: 'Consultation',
					price: 500,
					currency: 'HTG',
					doctorId: doctor.id
				}).returning()

				console.log(`   ✓ Created Consultation service for Dr. ${doctor.firstname} ${doctor.lastname} (${newService.id})`)
				consultationServices.set(doctor.id, newService.id)
			}
		}

		console.log(`\n✅ Created/found ${consultationServices.size} Consultation services\n`)

		// Step 3: Link appointments to Consultation services
		console.log('🔗 Linking appointments to Consultation services...')
		let linkedCount = 0
		let skippedCount = 0
		let linkedViaPatientCount = 0
		const appointmentsWithoutDoctor: AppointmentWithoutDoctor[] = []

		// Get all appointments
		const appointments = await db.select().from(Appointment)

		for (const appointment of appointments) {
			// Skip if already linked to a service
			if (appointment.serviceId) {
				skippedCount++
				continue
			}

			let doctorIdToUse = appointment.doctorId

			// If no doctorId, try to get it from the patient
			if (!doctorIdToUse && appointment.patientId) {
				const patient = await db
					.select()
					.from(Patient)
					.where(eq(Patient.id, appointment.patientId))
					.then(patients => patients[0])

				if (patient?.doctorId) {
					doctorIdToUse = patient.doctorId
					linkedViaPatientCount++
					console.log(`   🔄 Found doctorId via patient for appointment ${appointment.id}: ${doctorIdToUse}`)
					
					// Update appointment with doctorId for future reference
					await db.update(Appointment)
						.set({ doctorId: doctorIdToUse })
						.where(eq(Appointment.id, appointment.id))
				}
			}

			// If still no doctorId, log for manual handling
			if (!doctorIdToUse) {
				appointmentsWithoutDoctor.push({
					id: appointment.id,
					patientId: appointment.patientId,
					startDate: appointment.startDate,
					cost: appointment.cost
				})
				skippedCount++
				continue
			}

			const consultationServiceId = consultationServices.get(doctorIdToUse)
			if (!consultationServiceId) {
				console.warn(`   ⚠️  No Consultation service found for doctor ${doctorIdToUse}`)
				skippedCount++
				continue
			}

			// Update appointment with serviceId
			await db.update(Appointment)
				.set({ serviceId: consultationServiceId })
				.where(eq(Appointment.id, appointment.id))

			linkedCount++
		}

		console.log(`   ✓ Linked ${linkedCount} appointments`)
		if (linkedViaPatientCount > 0) {
			console.log(`   🔄 Linked ${linkedViaPatientCount} appointments via patient relationship`)
		}
		console.log(`   ⏭️  Skipped ${skippedCount} appointments (already linked or cannot determine doctorId)\n`)

		// Step 4: Log appointments without doctorId
		if (appointmentsWithoutDoctor.length > 0) {
			const logFilePath = join(process.cwd(), 'appointments-without-doctor.json')
			await writeFile(
				logFilePath,
				JSON.stringify(appointmentsWithoutDoctor, null, 2),
				'utf-8'
			)
			console.log(`📝 Logged ${appointmentsWithoutDoctor.length} appointments without doctorId to:`)
			console.log(`   ${logFilePath}\n`)
		}

		// Step 5: Verification
		console.log('🔍 Verifying migration...')
		
		// Count total appointments
		const totalResult = await db
			.select({ count: sql<number>`count(*)::int` })
			.from(Appointment)
		const totalAppointments = totalResult[0]?.count || 0

		// Count appointments with serviceId
		const linkedResult = await db
			.select({ count: sql<number>`count(*)::int` })
			.from(Appointment)
			.where(isNotNull(Appointment.serviceId))
		const linkedAppointments = linkedResult[0]?.count || 0

		// Count appointments without serviceId but with doctorId (should be 0 after migration)
		const unlinkedWithDoctorResult = await db
			.select({ count: sql<number>`count(*)::int` })
			.from(Appointment)
			.where(and(
				isNull(Appointment.serviceId),
				isNotNull(Appointment.doctorId)
			))
		const unlinkedWithDoctor = unlinkedWithDoctorResult[0]?.count || 0

		// Count appointments without doctorId
		const withoutDoctorResult = await db
			.select({ count: sql<number>`count(*)::int` })
			.from(Appointment)
			.where(isNull(Appointment.doctorId))
		const withoutDoctor = withoutDoctorResult[0]?.count || 0

		console.log(`   Total appointments: ${totalAppointments}`)
		console.log(`   Linked appointments: ${linkedAppointments}`)
		console.log(`   Unlinked (with doctorId): ${unlinkedWithDoctor}`)
		console.log(`   Without doctorId: ${withoutDoctor}\n`)

		console.log('✅ Migration completed successfully!\n')
		console.log('📋 Next steps:')
		console.log('   1. Review the appointments-without-doctor.json file if it was created')
		console.log('   2. Manually handle appointments without doctorId')
		console.log('   3. Once all appointments are linked, update the schema to make serviceId required')

	} catch (error) {
		console.error('❌ Migration failed:', error)
		throw error
	}
}

// Run the migration
migrateAppointmentsToServices()
	.then(() => {
		console.log('\n✨ Migration script finished')
		process.exit(0)
	})
	.catch((error) => {
		console.error('\n💥 Migration script failed:', error)
		process.exit(1)
	})

