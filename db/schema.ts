import { relations, sql } from 'drizzle-orm'
import { bigint, boolean, doublePrecision, foreignKey, integer, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

export const Sex = pgEnum('Sex', ['male', 'female'])

export const Status = pgEnum('Status', ['pending', 'paid', 'offline'])

export const FileType = pgEnum('FileType', ['IMAGE', 'PDF', 'VIDEO'])

export const ReportType = pgEnum('ReportType', ['Report', 'Certificate', 'ReferenceNote'])

export const Pricing_plan_interval = pgEnum('Pricing_plan_interval', ['day', 'week', 'month', 'year'])

export const Pricing_type = pgEnum('Pricing_type', ['one_time', 'recurring'])

export const Subscription_status = pgEnum('Subscription_status', ['trialing', 'active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'unpaid', 'paused'])

export const VaccineManufacturer = pgEnum('VaccineManufacturer', ['Pfizer', 'Moderna', 'JohnsonAndJohnson', 'AstraZeneca', 'Sanofi', 'GlaxoSmithKline', 'Merck', 'Novavax', 'Sinovac', 'Sinopharm', 'BharatBiotech', 'SerumInstituteOfIndia'])

export const DoseType = pgEnum('DoseType', ['regular', 'annual', 'booster', 'unique'])

export const Appointment = pgTable('Appointment', {
	startDate: timestamp('startDate', { precision: 3 }).notNull().defaultNow(),
	endDate: timestamp('endDate', { precision: 3 }),
	cost: integer('cost'),
	motif: text('motif'),
	transactionDate: timestamp('transactionDate', { precision: 3 }),
	transactionId: text('transactionId'),
	findings: text('findings'),
	recommendation: text('recommendation'),
	otherRemarks: text('otherRemarks'),
	doctorId: text('doctorId'),
	id: text('id').notNull().primaryKey().default(sql`cuid()`),
	patientId: text('patientId'),
	status: Status('status').default("offline"),
	head: doublePrecision('head'),
	height: doublePrecision('height'),
	weight: doublePrecision('weight'),
	exams: jsonb('exams'),
	medication: jsonb('medication'),
	arm: doublePrecision('arm'),
	sao2: doublePrecision('sao2'),
	temperature: doublePrecision('temperature'),
	pulse: integer('pulse'),
	respiratory: integer('respiratory'),
	systolic: doublePrecision('systolic'),
	diastolic: doublePrecision('diastolic'),
	vectorId: integer('vectorId'),
	files: text('files').array().notNull()
}, (Appointment) => ({
	'Appointment_Doctor_fkey': foreignKey({
		name: 'Appointment_Doctor_fkey',
		columns: [Appointment.doctorId],
		foreignColumns: [Doctor.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade'),
	'Appointment_Patient_fkey': foreignKey({
		name: 'Appointment_Patient_fkey',
		columns: [Appointment.patientId],
		foreignColumns: [Patient.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade')
}));

export type Appointment = typeof Appointment.$inferSelect
export type AppointmentInsert = typeof Appointment.$inferInsert

export const Doctor = pgTable('Doctor', {
	cost: integer('cost'),
	duration: integer('duration'),
	phone: text('phone'),
	address: text('address'),
	experience: integer('experience'),
	isActive: boolean('isActive').notNull(),
	isCompleted: boolean('isCompleted').notNull(),
	isDoctor: boolean('isDoctor').notNull(),
	isMedPro: boolean('isMedPro').notNull(),
	spec: text('spec'),
	summary: text('summary'),
	title: text('title'),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updatedAt', { precision: 3 }).notNull().defaultNow(),
	availability: jsonb('availability'),
	id: text('id').notNull().primaryKey().default(sql`cuid()`),
	email: text('email').notNull(),
	firstname: text('firstname').notNull(),
	lastname: text('lastname').notNull()
});

export type Doctor = typeof Doctor.$inferSelect
export type DoctorInsert = typeof Doctor.$inferInsert

export const Img = pgTable('Img', {
	url: text('url').notNull(),
	public_id: text('public_id').notNull(),
	doctorId: text('doctorId').unique(),
	id: text('id').notNull().primaryKey()
}, (Img) => ({
	'Img_Doctor_fkey': foreignKey({
		name: 'Img_Doctor_fkey',
		columns: [Img.doctorId],
		foreignColumns: [Doctor.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade')
}));

export type Img = typeof Img.$inferSelect
export type ImgInsert = typeof Img.$inferInsert

export const Patient = pgTable('Patient', {
	firstname: text('firstname').notNull(),
	lastname: text('lastname').notNull(),
	email: text('email'),
	isCompleted: boolean('isCompleted').notNull(),
	phone: text('phone'),
	profession: text('profession'),
	religion: text('religion'),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
	updatedAt: timestamp('updatedAt', { precision: 3 }).notNull().defaultNow(),
	id: text('id').notNull().primaryKey().default(sql`cuid()`),
	doctorId: text('doctorId'),
	birthdate: timestamp('birthdate', { precision: 3 }).notNull(),
	mothername: text('mothername'),
	sex: Sex('sex'),
	children: integer('children'),
	allergies: text('allergies'),
	history: text('history'),
	bloodtype: text('bloodtype'),
	electrophoresis: text('electrophoresis'),
	vectorId: integer('vectorId')
}, (Patient) => ({
	'Patient_Doctor_fkey': foreignKey({
		name: 'Patient_Doctor_fkey',
		columns: [Patient.doctorId],
		foreignColumns: [Doctor.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade')
}));

export type Patient = typeof Patient.$inferSelect
export type PatientInsert = typeof Patient.$inferInsert

export const documents = pgTable('documents', {
	id: bigint('id', { mode: 'bigint' }).notNull().primaryKey(),
	content: text('content'),
	metadata: jsonb('metadata')
});

export const File = pgTable('File', {
	id: text('id').notNull().primaryKey().default(sql`cuid()`),
	url: text('url').notNull().unique(),
	name: text('name').notNull(),
	fileType: FileType('fileType').notNull(),
	appointmentId: text('appointmentId').notNull()
}, (File) => ({
	'File_appointment_fkey': foreignKey({
		name: 'File_appointment_fkey',
		columns: [File.appointmentId],
		foreignColumns: [Appointment.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade')
}));

export type File = typeof File.$inferSelect
export type FileInsert = typeof File.$inferInsert

export const Report = pgTable('Report', {
	id: text('id').notNull().primaryKey().default(sql`cuid()`),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
	reportType: ReportType('reportType').notNull(),
	content: text('content').notNull(),
	patientId: text('patientId')
}, (Report) => ({
	'Report_Patient_fkey': foreignKey({
		name: 'Report_Patient_fkey',
		columns: [Report.patientId],
		foreignColumns: [Patient.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade')
}));

export type Report = typeof Report.$inferSelect
export type ReportInsert = typeof Report.$inferInsert

export const Receipt = pgTable('Receipt', {
	id: text('id').notNull().primaryKey().default(sql`cuid()`),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
	services: jsonb('services'),
	cost: doublePrecision('cost'),
	date: timestamp('date', { precision: 3 }),
	currency: text('currency'),
	patientId: text('patientId')
}, (Receipt) => ({
	'Receipt_Patient_fkey': foreignKey({
		name: 'Receipt_Patient_fkey',
		columns: [Receipt.patientId],
		foreignColumns: [Patient.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade')
}));

export type Receipt = typeof Receipt.$inferSelect
export type ReceiptInsert = typeof Receipt.$inferInsert

export const Product = pgTable('Product', {
	id: text('id').notNull().primaryKey(),
	active: boolean('active'),
	name: text('name'),
	description: text('description'),
	image: text('image'),
	metadata: jsonb('metadata')
});

export const Price = pgTable('Price', {
	id: text('id').notNull().primaryKey(),
	active: boolean('active'),
	description: text('description'),
	unit_amount: integer('unit_amount'),
	currency: text('currency'),
	pricing_type: Pricing_type('pricing_type'),
	interval: Pricing_plan_interval('interval'),
	interval_count: integer('interval_count'),
	trial_period_days: integer('trial_period_days'),
	metadata: jsonb('metadata'),
	productId: text('productId').notNull()
}, (Price) => ({
	'Price_product_fkey': foreignKey({
		name: 'Price_product_fkey',
		columns: [Price.productId],
		foreignColumns: [Product.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade')
}));

export type Price = typeof Price.$inferSelect
export type PriceInsert = typeof Price.$inferInsert

export const Subscription = pgTable('Subscription', {
	id: text('id').notNull().primaryKey(),
	status: Subscription_status('status').notNull(),
	metadata: jsonb('metadata'),
	quantity: integer('quantity'),
	cancel_at_period_end: boolean('cancel_at_period_end'),
	created: timestamp('created', { precision: 3 }).notNull().defaultNow(),
	current_period_start: timestamp('current_period_start', { precision: 3 }).notNull().defaultNow(),
	current_period_end: timestamp('current_period_end', { precision: 3 }).notNull().defaultNow(),
	ended_at: timestamp('ended_at', { precision: 3 }).defaultNow(),
	cancel_at: timestamp('cancel_at', { precision: 3 }).defaultNow(),
	canceled_at: timestamp('canceled_at', { precision: 3 }).defaultNow(),
	trial_start: timestamp('trial_start', { precision: 3 }).defaultNow(),
	trial_end: timestamp('trial_end', { precision: 3 }).defaultNow(),
	doctorId: text('doctorId'),
	priceId: text('priceId').notNull()
}, (Subscription) => ({
	'Subscription_price_fkey': foreignKey({
		name: 'Subscription_price_fkey',
		columns: [Subscription.priceId],
		foreignColumns: [Price.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade'),
	'Subscription_doctor_fkey': foreignKey({
		name: 'Subscription_doctor_fkey',
		columns: [Subscription.doctorId],
		foreignColumns: [Doctor.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade')
}));

export type Subscription = typeof Subscription.$inferSelect
export type SubscriptionInsert = typeof Subscription.$inferInsert

export const charts = pgTable('charts', {
	id: text('id').notNull().primaryKey(),
	p03: jsonb('p03').notNull(),
	p15: jsonb('p15').notNull(),
	p50: jsonb('p50').notNull(),
	p85: jsonb('p85').notNull(),
	p97: jsonb('p97').notNull(),
	height: jsonb('height')
});

export type Vaccin = typeof Vaccin.$inferSelect
export type VaccinInsert = typeof Vaccin.$inferInsert

export const Vaccin = pgTable('Vaccin', {
	id: text('id').notNull().primaryKey().default(sql`cuid()`),
	name: text('name').notNull(),
	doctorId: text('doctorId')
}, (Vaccin) => ({
	'Vaccin_doctor_fkey': foreignKey({
		name: 'Vaccin_doctor_fkey',
		columns: [Vaccin.doctorId],
		foreignColumns: [Doctor.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade')
}));

export type VaccinationRecord = typeof VaccinationRecord.$inferSelect
export type VaccinationRecordInsert = typeof VaccinationRecord.$inferInsert

export const VaccinationRecord = pgTable('VaccinationRecord', {
	id: text('id').notNull().primaryKey().default(sql`cuid()`),
	date: timestamp('date', { precision: 3 }).notNull(),
	notes: text('notes'),
	patientId: text('patientId').notNull(),
	vaccinId: text('vaccinId').notNull(),
	manufacturer: text('manufacturer').notNull(),
	lotNumber: text('lotNumber').notNull(),
	expiration: timestamp('expiration', { precision: 3 }).notNull(),
	dosage: text('dosage').notNull(),
	route: text('route').notNull(),
	site: text('site').notNull(),
	doseId: text('doseId').notNull()
}, (VaccinationRecord) => ({
	'VaccinationRecord_patient_fkey': foreignKey({
		name: 'VaccinationRecord_patient_fkey',
		columns: [VaccinationRecord.patientId],
		foreignColumns: [Patient.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade'),
	'VaccinationRecord_vaccin_fkey': foreignKey({
		name: 'VaccinationRecord_vaccin_fkey',
		columns: [VaccinationRecord.vaccinId],
		foreignColumns: [Vaccin.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade'),
	'VaccinationRecord_dose_fkey': foreignKey({
		name: 'VaccinationRecord_dose_fkey',
		columns: [VaccinationRecord.doseId],
		foreignColumns: [Dose.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade'),
	'VaccinationRecord_patientId_vaccinId_doseId_unique_idx': uniqueIndex('VaccinationRecord_patientId_vaccinId_doseId_key')
		.on(VaccinationRecord.patientId, VaccinationRecord.vaccinId, VaccinationRecord.doseId)
}));

export type Dose = typeof Dose.$inferSelect
export type DoseInsert = typeof Dose.$inferInsert

export const Dose = pgTable('Dose', {
	id: text('id').notNull().primaryKey().default(sql`cuid()`),
	doseCount: integer('doseCount'),
	maxAge: integer('maxAge'),
	doseType: DoseType('doseType').notNull(),
	vaccinId: text('vaccinId')
}, (Dose) => ({
	'Dose_Vaccin_fkey': foreignKey({
		name: 'Dose_Vaccin_fkey',
		columns: [Dose.vaccinId],
		foreignColumns: [Vaccin.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade')
}));

export type VaccinReference = typeof VaccinReference.$inferSelect
export type VaccinReferenceInsert = typeof VaccinReference.$inferInsert

export const VaccinReference = pgTable('VaccinReference', {
	id: text('id').notNull().primaryKey().default(sql`cuid()`),
	name: text('name').notNull()
});

export type VaccinReferenceDose = typeof VaccinReferenceDose.$inferSelect
export type VaccinReferenceDoseInsert = typeof VaccinReferenceDose.$inferInsert

export const VaccinReferenceDose = pgTable('VaccinReferenceDose', {
	id: text('id').notNull().primaryKey().default(sql`cuid()`),
	doseCount: integer('doseCount'),
	maxAge: integer('maxAge'),
	doseType: DoseType('doseType').notNull(),
	vaccinReferenceId: text('vaccinReferenceId').notNull()
}, (VaccinReferenceDose) => ({
	'VaccinReferenceDose_vaccinReference_fkey': foreignKey({
		name: 'VaccinReferenceDose_vaccinReference_fkey',
		columns: [VaccinReferenceDose.vaccinReferenceId],
		foreignColumns: [VaccinReference.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade')
}));

export const AppointmentRelations = relations(Appointment, ({ one, many }) => ({
	Doctor: one(Doctor, {
		relationName: 'AppointmentToDoctor',
		fields: [Appointment.doctorId],
		references: [Doctor.id]
	}),
	Patient: one(Patient, {
		relationName: 'AppointmentToPatient',
		fields: [Appointment.patientId],
		references: [Patient.id]
	}),
	uploadedFiles: many(File, {
		relationName: 'AppointmentToFile'
	})
}));

export const DoctorRelations = relations(Doctor, ({ many }) => ({
	appointments: many(Appointment, {
		relationName: 'AppointmentToDoctor'
	}),
	Img: many(Img, {
		relationName: 'DoctorToImg'
	}),
	patients: many(Patient, {
		relationName: 'DoctorToPatient'
	}),
	Subscription: many(Subscription, {
		relationName: 'DoctorToSubscription'
	}),
	trackedVaccines: many(Vaccin, {
		relationName: 'DoctorToVaccin'
	})
}));

export const ImgRelations = relations(Img, ({ one }) => ({
	Doctor: one(Doctor, {
		relationName: 'DoctorToImg',
		fields: [Img.doctorId],
		references: [Doctor.id]
	})
}));

export const PatientRelations = relations(Patient, ({ many, one }) => ({
	appointments: many(Appointment, {
		relationName: 'AppointmentToPatient'
	}),
	Doctor: one(Doctor, {
		relationName: 'DoctorToPatient',
		fields: [Patient.doctorId],
		references: [Doctor.id]
	}),
	reports: many(Report, {
		relationName: 'PatientToReport'
	}),
	receipts: many(Receipt, {
		relationName: 'PatientToReceipt'
	}),
	VaccinationRecords: many(VaccinationRecord, {
		relationName: 'PatientToVaccinationRecord'
	})
}));

export const FileRelations = relations(File, ({ one }) => ({
	appointment: one(Appointment, {
		relationName: 'AppointmentToFile',
		fields: [File.appointmentId],
		references: [Appointment.id]
	})
}));

export const ReportRelations = relations(Report, ({ one }) => ({
	Patient: one(Patient, {
		relationName: 'PatientToReport',
		fields: [Report.patientId],
		references: [Patient.id]
	})
}));

export const ReceiptRelations = relations(Receipt, ({ one }) => ({
	Patient: one(Patient, {
		relationName: 'PatientToReceipt',
		fields: [Receipt.patientId],
		references: [Patient.id]
	})
}));

export const ProductRelations = relations(Product, ({ many }) => ({
	price: many(Price, {
		relationName: 'PriceToProduct'
	})
}));

export const PriceRelations = relations(Price, ({ one, many }) => ({
	product: one(Product, {
		relationName: 'PriceToProduct',
		fields: [Price.productId],
		references: [Product.id]
	}),
	subscription: many(Subscription, {
		relationName: 'PriceToSubscription'
	})
}));

export const SubscriptionRelations = relations(Subscription, ({ one }) => ({
	price: one(Price, {
		relationName: 'PriceToSubscription',
		fields: [Subscription.priceId],
		references: [Price.id]
	}),
	doctor: one(Doctor, {
		relationName: 'DoctorToSubscription',
		fields: [Subscription.doctorId],
		references: [Doctor.id]
	})
}));

export const VaccinRelations = relations(Vaccin, ({ many, one }) => ({
	doses: many(Dose, {
		relationName: 'DoseToVaccin'
	}),
	records: many(VaccinationRecord, {
		relationName: 'VaccinToVaccinationRecord'
	}),
	doctor: one(Doctor, {
		relationName: 'DoctorToVaccin',
		fields: [Vaccin.doctorId],
		references: [Doctor.id]
	})
}));

export const VaccinationRecordRelations = relations(VaccinationRecord, ({ one }) => ({
	patient: one(Patient, {
		relationName: 'PatientToVaccinationRecord',
		fields: [VaccinationRecord.patientId],
		references: [Patient.id]
	}),
	vaccin: one(Vaccin, {
		relationName: 'VaccinToVaccinationRecord',
		fields: [VaccinationRecord.vaccinId],
		references: [Vaccin.id]
	}),
	dose: one(Dose, {
		relationName: 'DoseToVaccinationRecord',
		fields: [VaccinationRecord.doseId],
		references: [Dose.id]
	})
}));

export const DoseRelations = relations(Dose, ({ one, many }) => ({
	Vaccin: one(Vaccin, {
		relationName: 'DoseToVaccin',
		fields: [Dose.vaccinId],
		references: [Vaccin.id]
	}),
	VaccinationRecord: many(VaccinationRecord, {
		relationName: 'DoseToVaccinationRecord'
	})
}));

export const VaccinReferenceRelations = relations(VaccinReference, ({ many }) => ({
	doses: many(VaccinReferenceDose, {
		relationName: 'VaccinReferenceToVaccinReferenceDose'
	})
}));

export const VaccinReferenceDoseRelations = relations(VaccinReferenceDose, ({ one }) => ({
	vaccinReference: one(VaccinReference, {
		relationName: 'VaccinReferenceToVaccinReferenceDose',
		fields: [VaccinReferenceDose.vaccinReferenceId],
		references: [VaccinReference.id]
	})
}));