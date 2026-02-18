import { NextResponse } from "next/server";
import { importDomainsFromJson, type DomainExportEntry } from "@/lib/config";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    domains?: DomainExportEntry[];
  };

  if (!body.domains || !Array.isArray(body.domains)) {
    return NextResponse.json(
      { error: "Invalid format. Expected { domains: [...] }" },
      { status: 400 }
    );
  }

  const result = importDomainsFromJson(body.domains);
  return NextResponse.json(result);
}
