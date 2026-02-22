import { db } from "@/lib/db";
import { users, systemSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { UserRole } from "@/types";

export function getUserRole(userId: string): UserRole {
  const user = db.select().from(users).where(eq(users.id, userId)).get();
  return (user?.role as UserRole) || "user";
}

export function getSystemSetting(key: string): string | null {
  const row = db
    .select()
    .from(systemSettings)
    .where(eq(systemSettings.key, key))
    .get();
  return row?.value ?? null;
}

export function setSystemSetting(key: string, value: string): void {
  db.insert(systemSettings)
    .values({ key, value, updatedAt: new Date().toISOString() })
    .onConflictDoUpdate({
      target: systemSettings.key,
      set: { value, updatedAt: new Date().toISOString() },
    })
    .run();
}

export function deleteSystemSetting(key: string): void {
  db.delete(systemSettings).where(eq(systemSettings.key, key)).run();
}

export function getAllSystemSettings(): Record<string, string> {
  const rows = db.select().from(systemSettings).all();
  const map: Record<string, string> = {};
  for (const row of rows) {
    map[row.key] = row.value;
  }
  return map;
}

export function resolveRoleFromGroups(groupIds: string[]): UserRole | null {
  const adminGroupId = getSystemSetting("role_mapping_admin");
  const userGroupId = getSystemSetting("role_mapping_user");
  const viewerGroupId = getSystemSetting("role_mapping_viewer");

  if (adminGroupId && groupIds.includes(adminGroupId)) return "admin";
  if (userGroupId && groupIds.includes(userGroupId)) return "user";
  if (viewerGroupId && groupIds.includes(viewerGroupId)) return "viewer";
  return null;
}

export function isFirstUser(): boolean {
  const count = db.select().from(users).all().length;
  return count <= 1;
}
