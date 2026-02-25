import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { friends, debts, payments } from "@/db/schema";
import { eq, sum } from "drizzle-orm";
import { createFriendSchema } from "@/lib/validations";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  const denied = await requireAuth();
  if (denied) return denied;
  const rows = await db.query.friends.findMany({
    orderBy: (f, { asc }) => [asc(f.name)],
  });

  // Compute balance for each friend
  const result = await Promise.all(
    rows.map(async (f) => {
      const [owed] = await db
        .select({ total: sum(debts.amount) })
        .from(debts)
        .where(eq(debts.friendId, f.id));
      const [paid] = await db
        .select({ total: sum(payments.amount) })
        .from(payments)
        .where(eq(payments.friendId, f.id));

      const totalOwed = Number(owed?.total ?? 0);
      const totalPaid = Number(paid?.total ?? 0);
      return {
        ...f,
        totalOwed,
        totalPaid,
        remaining: totalOwed - totalPaid,
      };
    })
  );

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const denied = await requireAuth();
  if (denied) return denied;

  const body = await req.json();
  const parsed = createFriendSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  try {
    const [friend] = await db
      .insert(friends)
      .values({
        name: parsed.data.name,
        discordId: parsed.data.discordId || null,
      })
      .returning();
    return NextResponse.json(friend, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Name or Discord ID already exists" }, { status: 409 });
  }
}
