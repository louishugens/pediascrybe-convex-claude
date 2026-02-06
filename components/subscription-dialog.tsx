"use client";

import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSubscriptionGuard } from "@/hooks/use-subscription-guard";
import { Sparkles, Users, FileText, Stethoscope, Pill, FlaskConical, ClipboardList, Video } from "lucide-react";

export function SubscriptionDialog() {
  const router = useRouter();
  const { dialogOpen, blockedAction, closeDialog } = useSubscriptionGuard();

  const handleViewPlans = () => {
    closeDialog();
    router.push("/user/pricing");
  };

  // Map action names to icons
  const getActionIcon = (action: string | null) => {
    if (!action) return <Sparkles className="h-5 w-5" />;
    
    const actionLower = action.toLowerCase();
    if (actionLower.includes("patient")) return <Users className="h-5 w-5" />;
    if (actionLower.includes("record") || actionLower.includes("appointment")) return <FileText className="h-5 w-5" />;
    if (actionLower.includes("diagnostic")) return <Stethoscope className="h-5 w-5" />;
    if (actionLower.includes("prescription")) return <Pill className="h-5 w-5" />;
    if (actionLower.includes("lab") || actionLower.includes("exam")) return <FlaskConical className="h-5 w-5" />;
    if (actionLower.includes("report")) return <ClipboardList className="h-5 w-5" />;
    if (actionLower.includes("telehealth") || actionLower.includes("video")) return <Video className="h-5 w-5" />;

    return <Sparkles className="h-5 w-5" />;
  };

  return (
    <AlertDialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            {getActionIcon(blockedAction)}
          </div>
          <AlertDialogTitle className="text-center">
            Start Your Free Trial
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            {blockedAction ? (
              <>
                To <span className="font-medium text-foreground">{blockedAction}</span>, you need an active subscription.
              </>
            ) : (
              "Subscribe to unlock all features and start managing your practice."
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="my-4 space-y-3">
          <div className="rounded-lg border bg-muted/50 p-4">
            <h4 className="font-medium mb-2">7-Day Free Trial Includes:</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Patient management & EMR
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                AI-powered diagnostics & prescriptions
              </li>
              <li className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Growth charts & documentation
              </li>
            </ul>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-lg border p-2">
              <div className="font-semibold">Starter</div>
              <div className="text-muted-foreground">$29/mo</div>
            </div>
            <div className="rounded-lg border border-primary bg-primary/5 p-2">
              <div className="font-semibold">Pro</div>
              <div className="text-muted-foreground">$49/mo</div>
            </div>
            <div className="rounded-lg border p-2">
              <div className="font-semibold">Premium</div>
              <div className="text-muted-foreground">$99/mo</div>
            </div>
          </div>
        </div>

        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={closeDialog} className="w-full sm:w-auto">
            Maybe Later
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleViewPlans} className="w-full sm:w-auto">
            View Plans & Start Free Trial
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
