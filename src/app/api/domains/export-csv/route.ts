import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { domains } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { domainsToCsv } from "@/lib/csv";

export async function GET() {
  try {
    const { id: userId, role } = await requireAuth();

    const exportAll = role === "admin" || role === "viewer";
    const userDomains = exportAll
      ? db.select().from(domains).all()
      : db
          .select()
          .from(domains)
          .where(eq(domains.userId, userId))
          .all();

    const csv = domainsToCsv(
      userDomains.map((d) => ({
        domain: d.domain,
        notes: d.notes,
        enabled: d.enabled,
        ownerAccount: d.ownerAccount,
        paymentMethod: d.paymentMethod,
        paymentMethodExpiry: d.paymentMethodExpiry,
      }))
    );

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="domains-export.csv"',
      },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    throw err;
  }
}
