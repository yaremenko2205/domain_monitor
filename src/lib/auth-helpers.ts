import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { domains, domainShares } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import type { UserRole } from "@/types";

export type Permission = "read" | "edit" | "full_control";

const PERMISSION_LEVELS: Record<Permission, number> = {
  read: 1,
  edit: 2,
  full_control: 3,
};

export interface AuthUser {
  id: string;
  role: UserRole;
}

export async function requireAuth(): Promise<AuthUser> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return {
    id: session.user.id,
    role:
      ((session.user as Record<string, unknown>).role as UserRole) || "user",
  };
}

// Keep backward-compatible alias
export async function requireUserId(): Promise<string> {
  const user = await requireAuth();
  return user.id;
}

export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth();
  if (user.role !== "admin") {
    throw new Response(
      JSON.stringify({ error: "Forbidden: admin access required" }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
  return user;
}

export interface DomainAccess {
  domain: typeof domains.$inferSelect;
  permission: Permission;
  isOwner: boolean;
}

/**
 * Get a domain with the user's access level.
 * Returns null if user has no access.
 * If requiredPermission is provided, returns null if user's permission is insufficient.
 */
export function getDomainWithAccess(
  domainId: number,
  userId: string,
  requiredPermission?: Permission,
  userRole?: UserRole
): DomainAccess | null {
  const domain = db
    .select()
    .from(domains)
    .where(eq(domains.id, domainId))
    .get();

  if (!domain) return null;

  // Admin has full access to all domains
  if (userRole === "admin") {
    return {
      domain,
      permission: "full_control",
      isOwner: domain.userId === userId,
    };
  }

  // Viewer has read access to all domains
  if (userRole === "viewer") {
    if (
      requiredPermission &&
      PERMISSION_LEVELS[requiredPermission] > PERMISSION_LEVELS["read"]
    ) {
      return null;
    }
    return { domain, permission: "read", isOwner: false };
  }

  // Owner has full access
  if (domain.userId === userId) {
    return { domain, permission: "full_control", isOwner: true };
  }

  // Check shares
  const share = db
    .select()
    .from(domainShares)
    .where(
      and(
        eq(domainShares.domainId, domainId),
        eq(domainShares.sharedWithUserId, userId)
      )
    )
    .get();

  if (!share) return null;

  const userPermission = share.permission as Permission;

  // Check if permission is sufficient
  if (
    requiredPermission &&
    PERMISSION_LEVELS[userPermission] < PERMISSION_LEVELS[requiredPermission]
  ) {
    return null;
  }

  return { domain, permission: userPermission, isOwner: false };
}
