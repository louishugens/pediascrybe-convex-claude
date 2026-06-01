"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { Package, Sparkles, Loader2, Check } from "lucide-react";
import { api } from "@/convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type PackId = "small" | "medium" | "large";

const PACKS: Array<{
  id: PackId;
  label: string;
  price: string;
  credits: number;
  perCredit: string;
  popular?: boolean;
}> = [
  { id: "small", label: "Small", price: "$5", credits: 100, perCredit: "$0.05" },
  {
    id: "medium",
    label: "Medium",
    price: "$20",
    credits: 500,
    perCredit: "$0.04",
    popular: true,
  },
  { id: "large", label: "Large", price: "$35", credits: 1000, perCredit: "$0.035" },
];

interface BuyCreditPacksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BuyCreditPacksDialog({
  open,
  onOpenChange,
}: BuyCreditPacksDialogProps) {
  const [selected, setSelected] = useState<PackId>("medium");
  const [loading, setLoading] = useState(false);
  const createPackCheckout = useAction(api.aiPacks.createPackCheckout);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const result = await createPackCheckout({ packId: selected });
      if (result.url) {
        window.location.href = result.url;
      } else {
        toast.error("Could not start checkout. Please try again.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Buy AI credits
          </DialogTitle>
          <DialogDescription>
            Top up your AI credit balance. Pack credits are used after your
            monthly allowance is exhausted and do not roll over.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 md:grid-cols-3">
          {PACKS.map((pack) => {
            const isSelected = selected === pack.id;
            return (
              <Card
                key={pack.id}
                className={cn(
                  "relative cursor-pointer transition-all",
                  isSelected
                    ? "border-primary ring-2 ring-primary/20"
                    : "hover:border-primary/40",
                )}
                onClick={() => setSelected(pack.id)}
              >
                {pack.popular && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground uppercase">
                    Best value
                  </div>
                )}
                {isSelected && (
                  <div className="absolute right-3 top-3 rounded-full bg-primary p-1 text-primary-foreground">
                    <Check className="h-3 w-3" />
                  </div>
                )}
                <CardContent className="space-y-2 p-4">
                  <div className="text-sm font-medium text-muted-foreground">
                    {pack.label}
                  </div>
                  <div className="text-2xl font-bold">{pack.price}</div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <span className="font-medium">
                      {pack.credits.toLocaleString()}
                    </span>
                    <span className="text-muted-foreground">credits</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {pack.perCredit} per credit
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleCheckout} disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Package className="mr-2 h-4 w-4" />
            )}
            Buy {PACKS.find((p) => p.id === selected)?.label} pack
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
