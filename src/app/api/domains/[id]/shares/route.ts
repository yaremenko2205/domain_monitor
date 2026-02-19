import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { domainShares, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireUserId, getDomainWithAccess } from "@/lib/auth-helpers";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId();
    const { id } = await params;

    const access = getDomainWithAccess(Number(id), userId);
    if (!access) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    const shares = db
      .select()
      .from(domainShares)
      .where(eq(domainShares.domainId, Number(id)))
      .all();

    const enriched = shares.map((share) => {
      const user = db
        .select()
        .from(users)
        .where(eq(users.id, share.sharedWithUserId))
        .get();
      return {
        ...share,
        sharedWithEmail: user?.email || null,
        sharedWithName: user?.name || null,
      };
    });

    return NextResponse.json(enriched);
  } catch (err) {
    if (err instanceof Response) return err;
    throw err;
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId();
    const { id } = await params;

    // Only owner or full_control can share
    const access = getDomainWithAccess(Number(id), userId, "full_control");
    if (!access) {
      return NextResponse.json(
        { error: "Permission denied" },
        { status: 403 }
      );
    }

    const body = (await request.json()) as {
      email: string;
      permission: "read" | "edit" | "full_control";
    };

    if (!body.email || !body.permission) {
      return NextResponse.json(
        { error: "Email and permission required" },
        { status: 400 }
      );
    }

    const targetUser = db
      .select()
      .from(users)
      .where(eq(users.email, body.email.toLowerCase().trim()))
      .get();

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found. They must sign in at least once." },
        { status: 404 }
      );
    }

    if (targetUser.id === userId) {
      return NextResponse.json(
        { error: "Cannot share with yourself" },
        { status: 400 }
      );
    }

    // Check if already shared
    const existing = db
      .select()
      .from(domainShares)
      .where(
        and(
          eq(domainShares.domainId, Number(id)),
          eq(domainShares.sharedWithUserId, targetUser.id)
        )
      )
      .get();

    if (existing) {
      // Update permission
      db.update(domainShares)
        .set({ permission: body.permission })
        .where(eq(domainShares.id, existing.id))
        .run();
      return NextResponse.json({ success: true, updated: true });
    }

    db.insert(domainShares)
      .values({
        domainId: Number(id),
        sharedWithUserId: targetUser.id,
        permission: body.permission,
        createdAt: new Date().toISOString(),
      })
      .run();

    return NextResponse.json({ success: true, created: true });
  } catch (err) {
    if (err instanceof Response) return err;
    throw err;
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId();
    const { id } = await params;

    const access = getDomainWithAccess(Number(id), userId, "full_control");
    if (!access) {
      return NextResponse.json(
        { error: "Permission denied" },
        { status: 403 }
      );
    }

    const body = (await request.json()) as { shareId: number };
    if (!body.shareId) {
      return NextResponse.json(
        { error: "shareId required" },
        { status: 400 }
      );
    }

    db.delete(domainShares)
      .where(
        and(
          eq(domainShares.id, body.shareId),
          eq(domainShares.domainId, Number(id))
        )
      )
      .run();

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Response) return err;
    throw err;
  }
}
