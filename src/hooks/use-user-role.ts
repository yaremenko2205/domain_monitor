"use client";

import { useSession } from "next-auth/react";
import type { UserRole } from "@/types";

export function useUserRole(): {
  role: UserRole;
  isAdmin: boolean;
  isViewer: boolean;
  isUser: boolean;
} {
  const { data: session } = useSession();
  const role = (session?.user?.role as UserRole) || "user";
  return {
    role,
    isAdmin: role === "admin",
    isViewer: role === "viewer",
    isUser: role === "user",
  };
}
