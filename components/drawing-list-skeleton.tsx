"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function DrawingListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full rounded-md" />
      ))}
    </div>
  );
}
