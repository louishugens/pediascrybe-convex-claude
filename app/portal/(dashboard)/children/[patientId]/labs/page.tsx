"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { FlaskConical, Calendar, Clock, FileCheck2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function PortalLabsPage() {
  const params = useParams();
  const patientId = params.patientId as Id<"patients">;

  const overview = useQuery(api.portal.getLabsOverview, { patientId });

  if (overview === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    );
  }

  const hasNothing =
    overview.pending.length === 0 &&
    overview.resulted.length === 0 &&
    overview.cancelled.length === 0;

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex items-center gap-3">
        <FlaskConical className="h-5 w-5 text-primary" />
        <div>
          <h2 className="text-xl font-bold">Lab orders &amp; results</h2>
          <p className="text-sm text-muted-foreground">
            Lab tests ordered for your child, with results once available.
          </p>
        </div>
      </div>

      {hasNothing ? (
        <div className="text-center py-16 rounded-xl border border-dashed">
          <FlaskConical className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No lab orders yet.</p>
        </div>
      ) : (
        <>
          {/* Pending */}
          {overview.pending.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600" />
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Pending ({overview.pending.length})
                </h3>
              </div>
              <ul className="space-y-3">
                {overview.pending.map((order) => (
                  <li
                    key={order._id}
                    className="rounded-xl border border-border/50 bg-card/50 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{order.examName}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant={order.status === "ordered" ? "secondary" : "default"}>
                            {order.status}
                          </Badge>
                          {order.urgency && (
                            <Badge
                              variant={order.urgency === "stat" ? "destructive" : "secondary"}
                            >
                              {order.urgency}
                            </Badge>
                          )}
                        </div>
                        {order.clinicalContext && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {order.clinicalContext}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          Ordered {format(order.orderedAt ?? order.createdAt, "MMM d, yyyy")}
                        </p>
                      </div>
                      {order.appointmentId && (
                        <Link
                          href={`/portal/children/${patientId}/appointments/${order.appointmentId}` as any}
                          className="inline-flex items-center gap-1 text-xs text-primary shrink-0"
                        >
                          <Calendar className="h-3 w-3" />
                          Visit
                        </Link>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Resulted */}
          {overview.resulted.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <FileCheck2 className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Results ({overview.resulted.length})
                </h3>
              </div>
              <ul className="space-y-3">
                {overview.resulted.map((order) => (
                  <li
                    key={order._id}
                    className="rounded-xl border border-border/50 bg-card/50 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{order.examName}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant={order.status === "reviewed" ? "default" : "secondary"}>
                            {order.status}
                          </Badge>
                        </div>
                        {order.results.length > 0 && (
                          <ul className="mt-3 space-y-1">
                            {order.results.map((r) => (
                              <li
                                key={r._id}
                                className="text-sm flex items-center gap-2 flex-wrap"
                              >
                                <span className="font-medium">{r.value}</span>
                                {r.unit && (
                                  <span className="text-muted-foreground">{r.unit}</span>
                                )}
                                {r.referenceRange && (
                                  <span className="text-xs text-muted-foreground">
                                    (ref: {r.referenceRange})
                                  </span>
                                )}
                                {r.abnormalFlag && r.abnormalFlag !== "normal" && (
                                  <Badge
                                    variant={
                                      r.abnormalFlag === "critical" ? "destructive" : "default"
                                    }
                                    className="text-[10px]"
                                  >
                                    <AlertCircle className="h-2.5 w-2.5 mr-1" />
                                    {r.abnormalFlag}
                                  </Badge>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {order.resultedAt
                            ? `Resulted ${format(order.resultedAt, "MMM d, yyyy")}`
                            : `Ordered ${format(order.orderedAt ?? order.createdAt, "MMM d, yyyy")}`}
                        </p>
                      </div>
                      {order.appointmentId && (
                        <Link
                          href={`/portal/children/${patientId}/appointments/${order.appointmentId}` as any}
                          className="inline-flex items-center gap-1 text-xs text-primary shrink-0"
                        >
                          <Calendar className="h-3 w-3" />
                          Visit
                        </Link>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
