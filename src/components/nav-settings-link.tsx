"use client";

import Link from "next/link";
import { Settings } from "lucide-react";
import { useUserRole } from "@/hooks/use-user-role";

export function NavSettingsLink() {
  const { isAdmin } = useUserRole();
  if (!isAdmin) return null;
  return (
    <Link
      href="/settings"
      className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
    >
      <Settings className="h-4 w-4" />
      Settings
    </Link>
  );
}
