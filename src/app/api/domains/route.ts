import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { domains, domainShares } from "@/lib/db/schema";
import { daysUntilExpiry, getExpiryStatus } from "@/lib/utils";
import { eq, or } from "drizzle-orm";
import { lookupDomain } from "@/lib/services/whois";
import { requireAuth } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const { id: userId, role } = await requireAuth();

    if (role === "admin" || role === "viewer") {
      // Admin and viewer see ALL domains
      const allDomains = db.select().from(domains).all();
      const enriched = allDomains.map((d) => ({
        ...d,
        daysUntilExpiry: d.expiryDate ? daysUntilExpiry(d.expiryDate) : null,
        permission: role === "admin" ? ("full_control" as const) : ("read" as const),
        isOwner: d.userId === userId,
      }));
      return NextResponse.json(enriched);
    }

    // Regular user: own + shared domains
    const ownDomains = db
      .select()
      .from(domains)
      .where(eq(domains.userId, userId))
      .all();

    const shares = db
      .select()
      .from(domainShares)
      .where(eq(domainShares.sharedWithUserId, userId))
      .all();

    const sharedDomainIds = shares.map((s) => s.domainId);
    const sharedDomains =
      sharedDomainIds.length > 0
        ? db
            .select()
            .from(domains)
            .where(or(...sharedDomainIds.map((id) => eq(domains.id, id))))
            .all()
        : [];

    const enrichedOwn = ownDomains.map((d) => ({
      ...d,
      daysUntilExpiry: d.expiryDate ? daysUntilExpiry(d.expiryDate) : null,
      permission: "full_control" as const,
      isOwner: true,
    }));

    const enrichedShared = sharedDomains.map((d) => {
      const share = shares.find((s) => s.domainId === d.id);
      return {
        ...d,
        daysUntilExpiry: d.expiryDate ? daysUntilExpiry(d.expiryDate) : null,
        permission: share?.permission || "read",
        isOwner: false,
      };
    });

    return NextResponse.json([...enrichedOwn, ...enrichedShared]);
  } catch (err) {
    if (err instanceof Response) return err;
    throw err;
  }
}

export async function POST(request: Request) {
  try {
    const { id: userId, role } = await requireAuth();

    if (role === "viewer") {
      return NextResponse.json(
        { error: "Forbidden: viewers cannot create domains" },
        { status: 403 }
      );
    }

    const body = (await request.json()) as {
      domain?: string;
      notes?: string;
      ownerAccount?: string;
      paymentMethod?: string;
      paymentMethodExpiry?: string;
    };
    const domainName = body.domain?.toLowerCase().trim();

    if (!domainName) {
      return NextResponse.json(
        { error: "Domain name is required" },
        { status: 400 }
      );
    }

    // Check if user already has this domain
    const existing = db
      .select()
      .from(domains)
      .where(eq(domains.domain, domainName))
      .all()
      .find((d) => d.userId === userId);

    if (existing) {
      return NextResponse.json(
        { error: "Domain already exists" },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();
    db.insert(domains)
      .values({
        userId,
        domain: domainName,
        notes: body.notes || null,
        ownerAccount: body.ownerAccount || null,
        paymentMethod: body.paymentMethod || null,
        paymentMethodExpiry: body.paymentMethodExpiry || null,
        status: "unknown",
        createdAt: now,
        updatedAt: now,
      })
      .run();

    const inserted = db
      .select()
      .from(domains)
      .where(eq(domains.domain, domainName))
      .all()
      .find((d) => d.userId === userId)!;

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
  } catch (err) {
    if (err instanceof Response) return err;
    throw err;
  }
}
