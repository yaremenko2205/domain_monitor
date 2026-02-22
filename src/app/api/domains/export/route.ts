import { NextResponse } from "next/server";
import { exportDomainsToJson } from "@/lib/config";
import { requireAuth } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const { id: userId, role } = await requireAuth();
    const exportAll = role === "admin" || role === "viewer";
    const data = exportDomainsToJson(userId, exportAll);
    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": 'attachment; filename="domains-export.json"',
      },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    throw err;
  }
}
