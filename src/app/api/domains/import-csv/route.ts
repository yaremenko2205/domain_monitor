import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth-helpers";
import { importDomainsFromJson } from "@/lib/config";
import { parseCsvDomains } from "@/lib/csv";

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();

    const contentType = request.headers.get("content-type") || "";

    let csvText: string;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json(
          { error: "No file provided" },
          { status: 400 }
        );
      }
      csvText = await file.text();
    } else {
      csvText = await request.text();
    }

    const entries = parseCsvDomains(csvText);
    const result = importDomainsFromJson(entries, userId);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof Response) return err;
    if (err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
