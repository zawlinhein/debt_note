import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { groups, groupMembers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { updateGroupSchema } from "@/lib/validations";
import { requireAuth } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAuth();
  if (denied) return denied;

  const { id } = await params;
  const group = await db.query.groups.findFirst({
    where: eq(groups.id, Number(id)),
    with: { groupMembers: { with: { friend: true } } },
  });
  if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(group);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAuth();
  if (denied) return denied;

  const { id } = await params;
  const groupId = Number(id);
  const body = await req.json();
  const parsed = updateGroupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { name, friendIds } = parsed.data;

  if (name) {
    await db
      .update(groups)
      .set({ name })
      .where(eq(groups.id, groupId));
  }

  if (Array.isArray(friendIds)) {
    await db.delete(groupMembers).where(eq(groupMembers.groupId, groupId));
    if (friendIds.length) {
      await db.insert(groupMembers).values(
        friendIds.map((fid) => ({ groupId, friendId: fid }))
      );
    }
  }

  const updated = await db.query.groups.findFirst({
    where: eq(groups.id, groupId),
    with: { groupMembers: { with: { friend: true } } },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAuth();
  if (denied) return denied;

  const { id } = await params;
  await db.delete(groups).where(eq(groups.id, Number(id)));
  return new NextResponse(null, { status: 204 });
}
