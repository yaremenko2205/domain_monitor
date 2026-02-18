import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { domains, notificationLog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { daysUntilExpiry } from "@/lib/utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const domain = db
    .select()
    .from(domains)
    .where(eq(domains.id, Number(id)))
    .get();

  if (!domain) {
    return NextResponse.json({ error: "Domain not found" }, { status: 404 });
  }

  const logs = db
    .select()
    .from(notificationLog)
    .where(eq(notificationLog.domainId, domain.id))
    .all();

  return NextResponse.json({
    ...domain,
    daysUntilExpiry: domain.expiryDate
      ? daysUntilExpiry(domain.expiryDate)
      : null,
    notificationLogs: logs,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await request.json()) as {
    notes?: string;
    enabled?: boolean;
  };

  const domain = db
    .select()
    .from(domains)
    .where(eq(domains.id, Number(id)))
    .get();

  if (!domain) {
    return NextResponse.json({ error: "Domain not found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };
  if (body.notes !== undefined) updates.notes = body.notes;
  if (body.enabled !== undefined) updates.enabled = body.enabled;

  db.update(domains)
    .set(updates)
    .where(eq(domains.id, Number(id)))
    .run();

  const updated = db
    .select()
    .from(domains)
    .where(eq(domains.id, Number(id)))
    .get();

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const domain = db
    .select()
    .from(domains)
    .where(eq(domains.id, Number(id)))
    .get();

  if (!domain) {
    return NextResponse.json({ error: "Domain not found" }, { status: 404 });
  }

  db.delete(domains).where(eq(domains.id, Number(id))).run();

  return NextResponse.json({ success: true });
}
