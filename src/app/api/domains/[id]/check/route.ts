import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { domains } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { lookupDomain } from "@/lib/services/whois";
import { daysUntilExpiry, getExpiryStatus } from "@/lib/utils";
import { requireAuth, getDomainWithAccess } from "@/lib/auth-helpers";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId, role } = await requireAuth();
    const { id } = await params;

    const access = getDomainWithAccess(Number(id), userId, undefined, role);
    if (!access) {
      return NextResponse.json(
        { error: "Domain not found" },
        { status: 404 }
      );
    }

    const { domain } = access;

    const whois = await lookupDomain(domain.domain);
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
      .where(eq(domains.id, domain.id))
      .run();

    const updated = db
      .select()
      .from(domains)
      .where(eq(domains.id, domain.id))
      .get();

    return NextResponse.json({
      ...updated,
      daysUntilExpiry: updated?.expiryDate
        ? daysUntilExpiry(updated.expiryDate)
        : null,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    throw err;
  }
}
