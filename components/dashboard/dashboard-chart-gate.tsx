"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Lock, Sparkles } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Tier = "basic" | "standard" | "full";

interface DashboardChartGateProps {
  required: Tier;
  title: string;
  children: React.ReactNode;
}

const ORDER: Record<Tier, number> = { basic: 0, standard: 1, full: 2 };

export function DashboardChartGate({
  required,
  title,
  children,
}: DashboardChartGateProps) {
  const data = useQuery(api.usage.getUsageWithLimits);

  if (!data) return null;

  const current = (data.limits.dashboardTier || "basic") as Tier;
  const allowed = ORDER[current] >= ORDER[required];

  if (allowed) return <>{children}</>;

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-3 py-10 text-center">
        <div className="rounded-full bg-muted p-2">
          <Lock className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">
            Available on {required === "standard" ? "Professional" : "Complete"}{" "}
            and above
          </p>
        </div>
        <Link href="/user/pricing">
          <Button size="sm" variant="outline">
            <Sparkles className="mr-2 h-3.5 w-3.5" />
            Upgrade
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
