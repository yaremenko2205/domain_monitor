import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function daysUntilExpiry(expiryDateIso: string): number {
  const expiry = new Date(expiryDateIso);
  const now = new Date();
  const diffMs = expiry.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function getExpiryStatus(
  daysLeft: number | null
): "active" | "expiring_soon" | "expired" | "unknown" {
  if (daysLeft === null) return "unknown";
  if (daysLeft <= 0) return "expired";
  if (daysLeft <= 30) return "expiring_soon";
  return "active";
}

export function formatDate(isoDate: string | null): string {
  if (!isoDate) return "—";
  return new Date(isoDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
