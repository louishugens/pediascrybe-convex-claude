"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { cacheDocument, cacheDocuments } from "@/lib/offline/cache-manager";
import { offlineDb } from "@/lib/offline/db";
import { useNetworkStatus } from "@/lib/offline/hooks/useNetworkStatus";

export function OfflineCacheInitializer() {
  const { isOnline } = useNetworkStatus();
  const hasInitialized = useRef(false);

  // Eager-cache: doctor profile, services, vaccines, charts (small, rarely change)
  // Skip all queries when offline to avoid "Not authenticated" errors
  const appUser = useQuery(api.appUsers.getCurrentAppUser, isOnline ? undefined : "skip");
  const doctor = useQuery(
    api.doctors.getDoctorByAuthUserId,
    isOnline && appUser?.authUserId ? { authUserId: appUser.authUserId } : "skip"
  );
  const services = useQuery(
    api.services.list,
    isOnline && doctor?._id ? { doctorId: doctor._id } : "skip"
  );
  const vaccins = useQuery(
    api.vaccines.listByDoctor,
    isOnline && doctor?._id ? { doctorId: doctor._id } : "skip"
  );
  const charts = useQuery(api.charts.getAll, isOnline ? undefined : "skip");

  useEffect(() => {
    if (!isOnline || hasInitialized.current) return;

    const cacheEagerData = async () => {
      try {
        if (appUser && appUser._id) {
          await cacheDocument("appUsers", appUser);
        }
        if (doctor && doctor._id) {
          await cacheDocument("doctors", doctor);
        }
        if (services && Array.isArray(services)) {
          await cacheDocuments("services", services);
        }
        if (vaccins && Array.isArray(vaccins)) {
          // Cache the vaccine documents (with embedded doses)
          await cacheDocuments("vaccins", vaccins);

          // Also cache doses separately for vaccination compliance
          const allDoses: Record<string, unknown>[] = [];
          for (const vaccin of vaccins) {
            if (vaccin.doses && Array.isArray(vaccin.doses)) {
              for (const dose of vaccin.doses) {
                allDoses.push(dose);
              }
            }
          }
          if (allDoses.length > 0) {
            await cacheDocuments("doses", allDoses);
          }
        }
        if (charts && Array.isArray(charts) && charts.length > 0) {
          await cacheDocuments("charts", charts);
        }

        // Cache vaccination records for all cached patients
        try {
          const cachedPatients = await offlineDb.patients.toArray();
          if (cachedPatients.length > 0) {
            // Fetch vaccination records for each patient and cache them
            // This happens in the background and doesn't block initialization
            for (const p of cachedPatients) {
              const records = await offlineDb.vaccinationRecords
                .where("patientId")
                .equals(p._id)
                .count();
              // Only log/skip if we already have records (they were cached on a previous visit)
              if (records > 0) continue;
              // Records will be cached on-demand when the patient page is viewed
            }
          }
        } catch {
          // Non-critical: vaccination records will be cached on-demand
        }

        hasInitialized.current = true;
      } catch (err) {
        console.warn("[Offline] Failed to initialize cache:", err);
      }
    };

    if (appUser && doctor) {
      cacheEagerData();
    }
  }, [isOnline, appUser, doctor, services, vaccins, charts]);

  return null;
}
