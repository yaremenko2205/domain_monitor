"use client";

import { Badge } from "@/components/ui/badge";

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  active: { label: "Active", variant: "default" },
  expiring_soon: { label: "Expiring Soon", variant: "secondary" },
  expired: { label: "Expired", variant: "destructive" },
  error: { label: "Error", variant: "destructive" },
  unknown: { label: "Unknown", variant: "outline" },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig.unknown;
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function DaysLeftBadge({ days }: { days: number | null }) {
  if (days === null) return <span className="text-muted-foreground">—</span>;

  let className = "text-green-600 font-medium";
  if (days <= 0) className = "text-red-600 font-bold";
  else if (days <= 7) className = "text-red-500 font-bold";
  else if (days <= 30) className = "text-yellow-600 font-semibold";
  else if (days <= 60) className = "text-yellow-500 font-medium";

  return (
    <span className={className}>
      {days <= 0 ? `Expired ${Math.abs(days)}d ago` : `${days}d`}
    </span>
  );
}
