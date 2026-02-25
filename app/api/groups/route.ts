import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { groups, groupMembers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createGroupSchema } from "@/lib/validations";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  const denied = await requireAuth();
  if (denied) return denied;

  const rows = await db.query.groups.findMany({
    with: { groupMembers: { with: { friend: true } } },
    orderBy: (g, { asc }) => [asc(g.name)],
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const denied = await requireAuth();
  if (denied) return denied;

  const body = await req.json();
  const parsed = createGroupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { name, friendIds } = parsed.data;

  try {
    const [group] = await db
      .insert(groups)
      .values({ name })
      .returning();

    if (friendIds?.length) {
      await db.insert(groupMembers).values(
        friendIds.map((fid) => ({ groupId: group.id, friendId: fid }))
      );
    }

    return NextResponse.json(group, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Name already exists" }, { status: 409 });
  }
}
