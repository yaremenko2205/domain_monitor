import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { domains, notificationLog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { daysUntilExpiry } from "@/lib/utils";
import { requireAuth, getDomainWithAccess } from "@/lib/auth-helpers";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId, role } = await requireAuth();
    const { id } = await params;

    const access = getDomainWithAccess(Number(id), userId, undefined, role);
    if (!access) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    const { domain } = access;

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
      permission: access.permission,
      isOwner: access.isOwner,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    throw err;
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId, role } = await requireAuth();
    const { id } = await params;

    if (role === "viewer") {
      return NextResponse.json(
        { error: "Forbidden: viewers cannot edit domains" },
        { status: 403 }
      );
    }

    const access = getDomainWithAccess(Number(id), userId, "edit", role);
    if (!access) {
      return NextResponse.json(
        { error: "Permission denied" },
        { status: 403 }
      );
    }

    const body = (await request.json()) as {
      notes?: string;
      enabled?: boolean;
      ownerAccount?: string;
      paymentMethod?: string;
      paymentMethodExpiry?: string;
      passboltUrl?: string;
    };

    const updates: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.enabled !== undefined) updates.enabled = body.enabled;
    if (body.ownerAccount !== undefined) updates.ownerAccount = body.ownerAccount;
    if (body.paymentMethod !== undefined) updates.paymentMethod = body.paymentMethod;
    if (body.paymentMethodExpiry !== undefined) updates.paymentMethodExpiry = body.paymentMethodExpiry;
    if (body.passboltUrl !== undefined) updates.passboltUrl = body.passboltUrl;

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
  } catch (err) {
    if (err instanceof Response) return err;
    throw err;
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId, role } = await requireAuth();
    const { id } = await params;

    if (role === "viewer") {
      return NextResponse.json(
        { error: "Forbidden: viewers cannot delete domains" },
        { status: 403 }
      );
    }

    const access = getDomainWithAccess(Number(id), userId, "full_control", role);
    if (!access) {
      return NextResponse.json(
        { error: "Permission denied" },
        { status: 403 }
      );
    }

    db.delete(domains).where(eq(domains.id, Number(id))).run();

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Response) return err;
    throw err;
  }
}
