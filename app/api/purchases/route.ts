import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  purchases,
  lineItems,
  purchaseParticipants,
  debts,
} from "@/db/schema";
import { perPersonShare } from "@/lib/math";
import { createPurchaseSchema } from "@/lib/validations";
import { desc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  const denied = await requireAuth();
  if (denied) return denied;

  const rows = await db.query.purchases.findMany({
    with: {
      lineItems: true,
      participants: { with: { friend: true } },
      debts: { with: { friend: true } },
    },
    orderBy: [desc(purchases.date), desc(purchases.createdAt)],
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const denied = await requireAuth();
  if (denied) return denied;

  const body = await req.json();
  const parsed = createPurchaseSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { title, note, date, lineItemsInput, friendIds } = parsed.data;

  const total = lineItemsInput.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  // n = friends + you
  const nParticipants = friendIds.length + 1;
  const share = perPersonShare(total, nParticipants);

  const [purchase] = await db
    .insert(purchases)
    .values({
      title,
      note: note?.trim() || null,
      date,
      total: total.toFixed(2),
    })
    .returning();

  // Insert line items
  await db.insert(lineItems).values(
    lineItemsInput.map((item) => ({
      purchaseId: purchase.id,
      name: item.name,
      quantity: item.quantity.toString(),
      unitPrice: item.unitPrice.toFixed(2),
      subtotal: (item.quantity * item.unitPrice).toFixed(2),
    }))
  );

  // Insert participants (friends only — "you" is always implicit)
  await db.insert(purchaseParticipants).values(
    friendIds.map((fid) => ({ purchaseId: purchase.id, friendId: fid }))
  );

  // Insert debts (one per friend)
  await db.insert(debts).values(
    friendIds.map((fid) => ({
      purchaseId: purchase.id,
      friendId: fid,
      amount: share.toFixed(2),
    }))
  );

  return NextResponse.json(purchase, { status: 201 });
}
