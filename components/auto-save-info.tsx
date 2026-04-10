"use client";

import React from "react";
import { Info, CheckCircle2 } from "lucide-react";

export function AutoSaveInfo() {
  return (
    <div className="border-t border-border pt-4 px-3 pb-3">
      <div className="bg-accent/10 border border-accent/20 rounded-lg p-3 space-y-2">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 mt-0.5 text-accent flex-shrink-0" />
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-sidebar-foreground">Auto-Save Enabled</h4>
            <p className="text-xs text-sidebar-foreground/60">
              Your drawings are automatically saved to local storage every 200ms during editing and backed up every 5 seconds.
            </p>
            <ul className="text-xs text-sidebar-foreground/50 space-y-1 mt-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3" />
                Real-time auto-save
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3" />
                Automatic backups
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3" />
                Never lose your work
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
