import { NextResponse } from "next/server";
import { exportDomainsToJson } from "@/lib/config";

export async function GET() {
  const data = exportDomainsToJson();
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="domains-export.json"',
    },
  });
}
