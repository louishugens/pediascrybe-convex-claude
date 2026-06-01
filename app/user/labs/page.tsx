"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { differenceInYears, differenceInMonths } from "date-fns";
import Link from "next/link";
import {
  FlaskConical,
  Search,
  AlertTriangle,
  Eye,
  ChevronRight,
} from "lucide-react";

type Order = {
  _id: Id<"labOrders">;
  examName: string;
  status: "ordered" | "collected" | "resulted" | "reviewed" | "cancelled";
  orderedAt?: number;
  createdAt: number;
  urgency?: "routine" | "urgent" | "stat";
};

type Visit = {
  key: string;
  appointmentId?: string;
  visitDate?: number;
  motif?: string;
  orders: Order[];
};

type PatientGroup = {
  patientId: string;
  patient: {
    firstname: string;
    lastname: string;
    birthdate?: number;
    sex?: string;
  } | null;
  visits: Visit[];
  pendingCount: number;
  awaitingReviewCount: number;
  hasStat: boolean;
  oldestOrderedAt: number;
};

type FilterMode = "all" | "stat" | "awaiting";
type SortMode = "priority" | "oldest" | "newest";

function ageLabel(birthdate?: number): string {
  if (!birthdate) return "";
  const now = new Date();
  const dob = new Date(birthdate);
  const years = differenceInYears(now, dob);
  if (years >= 2) return `${years}y`;
  const months = differenceInMonths(now, dob);
  return `${months}mo`;
}

export default function DoctorLabsInboxPage() {
  const me = useQuery(api.doctors.getCurrent);
  const groups = useQuery(
    api.appointments.getLabWorklist,
    me?._id ? { doctorId: me._id } : "skip",
  );

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterMode>("all");
  const [sort, setSort] = useState<SortMode>("priority");

  const visible = useMemo<PatientGroup[]>(() => {
    if (!groups) return [];
    let list = (groups as PatientGroup[]).slice();

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((g) => {
        if (!g.patient) return false;
        return `${g.patient.firstname} ${g.patient.lastname}`
          .toLowerCase()
          .includes(q);
      });
    }

    if (filter === "stat") list = list.filter((g) => g.hasStat);
    if (filter === "awaiting") list = list.filter((g) => g.awaitingReviewCount > 0);

    list.sort((a, b) => {
      if (sort === "priority") {
        if (a.hasStat !== b.hasStat) return a.hasStat ? -1 : 1;
        if ((a.awaitingReviewCount > 0) !== (b.awaitingReviewCount > 0))
          return a.awaitingReviewCount > 0 ? -1 : 1;
        return a.oldestOrderedAt - b.oldestOrderedAt;
      }
      if (sort === "oldest") return a.oldestOrderedAt - b.oldestOrderedAt;
      return b.oldestOrderedAt - a.oldestOrderedAt;
    });

    return list;
  }, [groups, search, filter, sort]);

  if (me === undefined || groups === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <FlaskConical className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Labs inbox</h1>
          <p className="text-sm text-muted-foreground">
            Patients with pending lab orders. Click a row to open that patient&apos;s labs.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search patient name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-1 rounded-lg border p-1 bg-card">
          {(["all", "stat", "awaiting"] as const).map((mode) => (
            <Button
              key={mode}
              size="sm"
              variant={filter === mode ? "default" : "ghost"}
              className="h-8"
              onClick={() => setFilter(mode)}
            >
              {mode === "all"
                ? "All"
                : mode === "stat"
                  ? "Stat only"
                  : "Awaiting review"}
            </Button>
          ))}
        </div>

        <Select value={sort} onValueChange={(v) => setSort(v as SortMode)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="priority">Priority</SelectItem>
            <SelectItem value="oldest">Oldest pending</SelectItem>
            <SelectItem value="newest">Newest first</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed py-20 text-center">
          <FlaskConical className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            {groups.length === 0
              ? "No pending lab orders. You're all caught up."
              : "No patients match the current filter."}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card divide-y overflow-hidden">
          {visible.map((g) => {
            if (!g.patient) return null;
            const name = `${g.patient.firstname} ${g.patient.lastname}`;
            const age = ageLabel(g.patient.birthdate);
            const sexGlyph =
              g.patient.sex === "male" ? "♂" : g.patient.sex === "female" ? "♀" : "";
            return (
              <Link
                key={g.patientId}
                href={`/user/patients/${g.patientId}/labs` as any}
                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/40 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{name}</span>
                    {(age || sexGlyph) && (
                      <span className="text-sm text-muted-foreground">
                        {age}
                        {age && sexGlyph ? " · " : ""}
                        {sexGlyph}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {g.hasStat && (
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      stat
                    </Badge>
                  )}
                  {g.awaitingReviewCount > 0 && (
                    <Badge variant="default" className="gap-1">
                      <Eye className="h-3 w-3" />
                      {g.awaitingReviewCount} to review
                    </Badge>
                  )}
                  {g.pendingCount > 0 && (
                    <Badge variant="secondary">{g.pendingCount} pending</Badge>
                  )}
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
