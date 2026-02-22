import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const { id, role } = await requireAuth();
    return NextResponse.json({ id, role });
  } catch (err) {
    if (err instanceof Response) return err;
    throw err;
  }
}
