"use client";

import { useQuery } from "convex/react";
import { Sparkles, AlertTriangle, Package } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

interface CreditBalanceWidgetProps {
  onBuyCreditsClick?: () => void;
  compact?: boolean;
}

export function CreditBalanceWidget({
  onBuyCreditsClick,
  compact = false,
}: CreditBalanceWidgetProps) {
  const data = useQuery(api.usage.getUsageWithLimits);

  if (!data) return null;

  const used = data.usage.aiCreditsUsed;
  const limit = data.limits.aiCredits;
  const pack = data.usage.packCreditsRemaining;
  const percent = data.percentUsed.aiCredits;
  const includedRemaining = Math.max(0, limit - used);
  const totalRemaining = includedRemaining + pack;

  const atCap = percent >= 100 && pack === 0;
  const warning = percent >= 80 && !atCap;

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5 font-medium">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            AI Credits
          </span>
          <span className="text-muted-foreground">
            {used}/{limit}
            {pack > 0 && (
              <span className="ml-1 text-primary">+{pack} pack</span>
            )}
          </span>
        </div>
        <Progress value={percent} className="h-1.5" />
        {atCap && (
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={onBuyCreditsClick}
          >
            <Package className="mr-2 h-3.5 w-3.5" />
            Buy credits
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-primary" />
          AI Credits
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold">{totalRemaining}</div>
            <div className="text-sm text-muted-foreground">
              remaining this month
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {used} of {limit} included used
            </span>
            {pack > 0 && (
              <span className="font-medium text-primary">
                + {pack} pack credits
              </span>
            )}
          </div>
          <Progress value={percent} className="mt-2 h-2" />
        </div>

        {warning && (
          <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <div>
              You've used {percent}% of your monthly AI credits. Consider
              upgrading or buying a credit pack to avoid interruptions.
            </div>
          </div>
        )}

        {atCap && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-xs">
            <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
            <div>
              You've run out of AI credits. Buy a pack to keep using AI
              features this month.
            </div>
          </div>
        )}

        <Button
          variant={atCap ? "default" : "outline"}
          className="w-full"
          onClick={onBuyCreditsClick}
        >
          <Package className="mr-2 h-4 w-4" />
          Buy credit pack
        </Button>
      </CardContent>
    </Card>
  );
}
