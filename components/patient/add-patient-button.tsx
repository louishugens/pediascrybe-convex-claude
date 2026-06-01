"use client";

import { useRouter } from "next/navigation";
import { useSubscriptionGuard } from "@/hooks/use-subscription-guard";

export function AddPatientButton() {
  const router = useRouter();
  const { requireSubscription } = useSubscriptionGuard();

  return (
    <button
      className="self-end px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm hover:bg-primary/80 transition-colors cursor-pointer"
      onClick={() => {
        if (requireSubscription("add patients")) {
          router.push("/user/add-patient");
        }
      }}
    >
      Add Patient
    </button>
  );
}
