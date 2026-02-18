import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { domains } from "@/lib/db/schema";
import { daysUntilExpiry, getExpiryStatus } from "@/lib/utils";
import { eq } from "drizzle-orm";
import { lookupDomain } from "@/lib/services/whois";

export async function GET() {
  const allDomains = db.select().from(domains).all();
  const enriched = allDomains.map((d) => ({
    ...d,
    daysUntilExpiry: d.expiryDate ? daysUntilExpiry(d.expiryDate) : null,
  }));
  return NextResponse.json(enriched);
}

export async function POST(request: Request) {
  const body = (await request.json()) as { domain?: string; notes?: string };
  const domainName = body.domain?.toLowerCase().trim();

  if (!domainName) {
    return NextResponse.json(
      { error: "Domain name is required" },
      { status: 400 }
    );
  }

  // Check if already exists
  const existing = db
    .select()
    .from(domains)
    .where(eq(domains.domain, domainName))
    .get();

  if (existing) {
    return NextResponse.json(
      { error: "Domain already exists" },
      { status: 409 }
    );
  }

  const now = new Date().toISOString();
  db.insert(domains)
    .values({
      domain: domainName,
      notes: body.notes || null,
      status: "unknown",
      createdAt: now,
      updatedAt: now,
    })
    .run();

  const inserted = db
    .select()
    .from(domains)
    .where(eq(domains.domain, domainName))
    .get()!;

  // Trigger WHOIS lookup immediately
  const whois = await lookupDomain(domainName);
  const days = whois.expiryDate ? daysUntilExpiry(whois.expiryDate) : null;
  const status = whois.error ? "error" : getExpiryStatus(days);

  db.update(domains)
    .set({
      registrar: whois.registrar,
      creationDate: whois.creationDate,
      expiryDate: whois.expiryDate,
      lastChecked: new Date().toISOString(),
      whoisRaw: JSON.stringify(whois.rawData),
      status,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(domains.id, inserted.id))
    .run();

  const updated = db
    .select()
    .from(domains)
    .where(eq(domains.id, inserted.id))
    .get();

  return NextResponse.json({
    ...updated,
    daysUntilExpiry: updated?.expiryDate
      ? daysUntilExpiry(updated.expiryDate)
      : null,
  });
}
