import { NextResponse } from "next/server";
import { exportDomainsToJson } from "@/lib/config";
import { requireUserId } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const userId = await requireUserId();
    const data = exportDomainsToJson(userId);
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
