"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function CanvasSkeleton() {
  return (
    <div className="w-full h-full flex flex-col gap-4 p-6 bg-background">
      {/* Header area skeleton */}
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </div>

      {/* Main canvas area skeleton */}
      <div className="flex-1 flex gap-4">
        {/* Sidebar skeleton */}
        {/* <div className="w-64 flex flex-col gap-4">
          <Skeleton className="h-10 w-full" />
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div> */}

        {/* Canvas area skeleton */}
        <div className="flex-1">
          <Skeleton className="w-full h-full rounded-lg" />
        </div>
      </div>

      {/* Loading text */}
      <div className="text-center text-sm text-muted-foreground">
        <p className="animate-pulse">Loading your drawings...</p>
      </div>
    </div>
  );
}
