import { NextResponse } from "next/server";
import { importDomainsFromJson, type DomainExportEntry } from "@/lib/config";
import { requireAuth } from "@/lib/auth-helpers";

export async function POST(request: Request) {
  try {
    const { id: userId, role } = await requireAuth();

    if (role === "viewer") {
      return NextResponse.json(
        { error: "Forbidden: viewers cannot import domains" },
        { status: 403 }
      );
    }

    const body = (await request.json()) as {
      domains?: DomainExportEntry[];
    };

    if (!body.domains || !Array.isArray(body.domains)) {
      return NextResponse.json(
        { error: "Invalid format. Expected { domains: [...] }" },
        { status: 400 }
      );
    }

    const result = importDomainsFromJson(body.domains, userId);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof Response) return err;
    throw err;
  }
}
