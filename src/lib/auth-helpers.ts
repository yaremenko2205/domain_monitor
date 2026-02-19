import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { domains, domainShares } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export type Permission = "read" | "edit" | "full_control";

const PERMISSION_LEVELS: Record<Permission, number> = {
  read: 1,
  edit: 2,
  full_control: 3,
};

export async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return session.user.id;
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
  requiredPermission?: Permission
): DomainAccess | null {
  const domain = db
    .select()
    .from(domains)
    .where(eq(domains.id, domainId))
    .get();

  if (!domain) return null;

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
