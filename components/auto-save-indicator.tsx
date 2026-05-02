"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useDrawings } from "@/providers/DrawingsProvider";

export function AutoSaveIndicator() {
  const { saveStatus, lastSaveTime, isSynced } = useDrawings();
  const [showIndicator, setShowIndicator] = useState(false);
  const [timeSinceLastSave, setTimeSinceLastSave] = useState("");

  useEffect(() => {
    // Show indicator when saving or if error
    if (saveStatus === "saving" || saveStatus === "error" || isSynced) {
      setShowIndicator(true);
    }

    // Hide indicator after successfully saved (after 2 seconds)
    if (saveStatus === "saved") {
      setShowIndicator(true);
      const timeout = setTimeout(() => setShowIndicator(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [saveStatus]);

  // Update time since last save
  useEffect(() => {
    const updateTime = () => {
      const now = Date.now();
      const diff = now - lastSaveTime;
      const seconds = Math.floor(diff / 1000);

      if (seconds < 60) {
        setTimeSinceLastSave(`${seconds}s ago`);
      } else {
        const minutes = Math.floor(seconds / 60);
        setTimeSinceLastSave(`${minutes}m ago`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [lastSaveTime]);

  if (!showIndicator && saveStatus === "idle") {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-2xl border border-muted/80 bg-background/90 px-3 py-2 text-foreground animate-in fade-in slide-in-from-bottom-2">
      {saveStatus === "saving" && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      {saveStatus === "saved" && <CheckCircle2 className="h-4 w-4 text-accent" />}
      {saveStatus === "error" && <AlertCircle className="h-4 w-4 text-destructive" />}
      <div className="leading-tight">
    
        <div className="text-xs text-zinc-200">
          {saveStatus === "saving" && "Syncing changes"}
          {saveStatus === "saved" && (timeSinceLastSave ? `Saved ${timeSinceLastSave}` : "Saved")}
          {saveStatus === "error" && "Sync failed"}
          {saveStatus === "idle" && isSynced && (timeSinceLastSave ? `Saved ${timeSinceLastSave}` : "Ready")}
        </div>
      </div>
    </div>
  );
}
