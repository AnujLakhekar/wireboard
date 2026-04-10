"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useDrawings } from "@/providers/DrawingsProvider";

export function AutoSaveIndicator() {
  const { saveStatus, lastSaveTime } = useDrawings();
  const [showIndicator, setShowIndicator] = useState(false);
  const [timeSinceLastSave, setTimeSinceLastSave] = useState("");

  useEffect(() => {
    // Show indicator when saving or if error
    if (saveStatus === "saving" || saveStatus === "error") {
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
    <div className="fixed bottom-4 right-4 bg-background px-3 py-2 rounded border border-border z-40 shadow-sm flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
      {saveStatus === "saving" && (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
          <span className="text-xs text-sidebar-foreground/60">Saving...</span>
        </>
      )}
      {saveStatus === "saved" && (
        <>
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          <span className="text-xs text-sidebar-foreground/60">Saved {timeSinceLastSave}</span>
        </>
      )}
      {saveStatus === "error" && (
        <>
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span className="text-xs text-red-500">Save failed - check storage</span>
        </>
      )}
      {saveStatus === "idle" && timeSinceLastSave && (
        <>
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          <span className="text-xs text-sidebar-foreground/60">All saved {timeSinceLastSave}</span>
        </>
      )}
    </div>
  );
}
