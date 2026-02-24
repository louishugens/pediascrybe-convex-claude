"use client";

import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pwa-install-dismissed";

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    // Check if previously dismissed
    const wasDismissed = localStorage.getItem(DISMISS_KEY);
    if (wasDismissed) {
      setDismissed(true);
      return;
    }
    setDismissed(false);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(DISMISS_KEY, "true");
  };

  if (dismissed || !deferredPrompt) return null;

  return (
    <div className="bg-primary/5 border-b border-primary/20 px-4 py-2 flex items-center justify-between text-sm">
      <div className="flex items-center gap-2 text-primary">
        <Download className="h-4 w-4" />
        <span>Install Pediascrybe for offline access</span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="default"
          size="sm"
          className="h-7 text-xs"
          onClick={handleInstall}
        >
          Install
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={handleDismiss}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
