import * as React from "react";

export function DashboardSkeleton() {
  return (
    <div className="p-6 md:p-8 space-y-8 animate-pulse">
      {/* Welcome Title Skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-64 bg-surface rounded-lg" />
        <div className="h-4 w-96 bg-surface/60 rounded-md" />
      </div>

      {/* Quick Action Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-32 rounded-2xl bg-surface border border-border/80 p-5 flex flex-col justify-between"
          >
            <div className="h-8 w-8 rounded-lg bg-surface-hover" />
            <div className="space-y-1.5">
              <div className="h-5 w-32 bg-surface-hover rounded" />
              <div className="h-3 w-40 bg-surface-hover/60 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Content Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-6 w-48 bg-surface rounded" />
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-28 rounded-2xl bg-surface border border-border p-4 flex gap-4"
              >
                <div className="w-36 h-full rounded-xl bg-surface-hover" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 bg-surface-hover rounded" />
                  <div className="h-4 w-full bg-surface-hover/60 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="h-6 w-36 bg-surface rounded" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-28 rounded-xl bg-surface border border-border"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
