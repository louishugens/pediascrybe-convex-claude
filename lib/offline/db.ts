import Dexie, { type EntityTable } from "dexie";
import type {
  CachedDoctor,
  CachedPatient,
  CachedAppointment,
  CachedPrescription,
  CachedLabOrder,
  CachedLabResult,
  CachedVaccin,
  CachedDose,
  CachedVaccinationRecord,
  CachedService,
  CachedChart,
  CachedFile,
  CachedAppUser,
  SyncQueueEntry,
  QueryCacheEntry,
} from "./types";

class PediascrybeOfflineDB extends Dexie {
  doctors!: EntityTable<CachedDoctor, "_id">;
  patients!: EntityTable<CachedPatient, "_id">;
  appointments!: EntityTable<CachedAppointment, "_id">;
  prescriptions!: EntityTable<CachedPrescription, "_id">;
  labOrders!: EntityTable<CachedLabOrder, "_id">;
  labResults!: EntityTable<CachedLabResult, "_id">;
  vaccins!: EntityTable<CachedVaccin, "_id">;
  doses!: EntityTable<CachedDose, "_id">;
  vaccinationRecords!: EntityTable<CachedVaccinationRecord, "_id">;
  services!: EntityTable<CachedService, "_id">;
  charts!: EntityTable<CachedChart, "_id">;
  files!: EntityTable<CachedFile, "_id">;
  appUsers!: EntityTable<CachedAppUser, "_id">;
  syncQueue!: EntityTable<SyncQueueEntry, "id">;
  queryCache!: EntityTable<QueryCacheEntry, "queryKey">;

  constructor() {
    super("pediascrybe-offline");

    this.version(1).stores({
      // Cached data tables
      doctors: "_id, authUserId",
      patients: "_id, doctorId",
      appointments: "_id, doctorId, patientId, startDate",
      vaccins: "_id, doctorId",
      doses: "_id, vaccinId",
      vaccinationRecords: "_id, patientId, vaccinId",
      services: "_id, doctorId",
      charts: "_id, chartId",
      files: "_id, appointmentId",
      appUsers: "_id, authUserId",
      // Sync infrastructure
      syncQueue: "++id, status, createdAt",
      queryCache: "queryKey, doctorId, lastUpdated",
    });

    // v2 — standalone prescriptions/labOrders/labResults stores.
    this.version(2).stores({
      prescriptions: "_id, doctorId, patientId, appointmentId, status, createdAt",
      labOrders: "_id, doctorId, patientId, appointmentId, status, orderedAt",
      labResults: "_id, labOrderId, patientId, enteredAt",
    });
  }
}

export const offlineDb = new PediascrybeOfflineDB();
