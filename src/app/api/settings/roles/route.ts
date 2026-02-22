import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { getSystemSetting, setSystemSetting, deleteSystemSetting } from "@/lib/roles";

export async function GET() {
  try {
    await requireAdmin();

    return NextResponse.json({
      role_mapping_admin: getSystemSetting("role_mapping_admin"),
      role_mapping_user: getSystemSetting("role_mapping_user"),
      role_mapping_viewer: getSystemSetting("role_mapping_viewer"),
      default_role: getSystemSetting("default_role"),
    });
  } catch (err) {
    if (err instanceof Response) return err;
    throw err;
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin();

    const body = (await request.json()) as Record<string, string>;

    const allowedKeys = [
      "role_mapping_admin",
      "role_mapping_user",
      "role_mapping_viewer",
      "default_role",
    ];

    for (const [key, value] of Object.entries(body)) {
      if (allowedKeys.includes(key)) {
        if (value && typeof value === "string" && value.trim() !== "") {
          setSystemSetting(key, value.trim());
        } else {
          // Remove the setting if value is empty
          deleteSystemSetting(key);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Response) return err;
    throw err;
  }
}
