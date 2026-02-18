import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { domains } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { lookupDomain } from "@/lib/services/whois";
import { daysUntilExpiry, getExpiryStatus } from "@/lib/utils";
import { processNotifications } from "@/lib/services/notification";

export async function POST(request: Request) {
  // Verify CRON_SECRET for external callers
  const secret = request.headers.get("x-cron-secret");
  const isInternal = request.headers.get("x-internal") === "true";

  if (
    !isInternal &&
    secret !== process.env.CRON_SECRET &&
    process.env.CRON_SECRET
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allDomains = db
    .select()
    .from(domains)
    .where(eq(domains.enabled, true))
    .all();

  const results: Array<{
    domain: string;
    expiryDate: string | null;
    daysLeft: number | null;
    error: string | null;
  }> = [];

  for (const d of allDomains) {
    const whois = await lookupDomain(d.domain);
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
      .where(eq(domains.id, d.id))
      .run();

    if (whois.expiryDate && days !== null) {
      await processNotifications(
        { id: d.id, domain: d.domain, expiryDate: whois.expiryDate },
        days
      );
    }

    results.push({
      domain: d.domain,
      expiryDate: whois.expiryDate,
      daysLeft: days,
      error: whois.error,
    });

    // Rate limit: 2s between WHOIS queries
    if (allDomains.indexOf(d) < allDomains.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  return NextResponse.json({ checked: results.length, results });
}
