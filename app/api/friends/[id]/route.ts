import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { friends, debts, payments } from "@/db/schema";
import { eq, sum } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAuth();
  if (denied) return denied;

  const { id } = await params;
  const friendId = Number(id);

  const [owed] = await db
    .select({ total: sum(debts.amount) })
    .from(debts)
    .where(eq(debts.friendId, friendId));
  const [paid] = await db
    .select({ total: sum(payments.amount) })
    .from(payments)
    .where(eq(payments.friendId, friendId));

  const remaining = Number(owed?.total ?? 0) - Number(paid?.total ?? 0);
  if (remaining > 0) {
    return NextResponse.json(
      { error: "Cannot delete friend with outstanding balance" },
      { status: 409 }
    );
  }

  await db.delete(friends).where(eq(friends.id, friendId));
  return new NextResponse(null, { status: 204 });
}
