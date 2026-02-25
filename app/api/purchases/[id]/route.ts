import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  purchases,
  lineItems,
  purchaseParticipants,
  debts,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { perPersonShare } from "@/lib/math";
import { updatePurchaseSchema } from "@/lib/validations";
import { requireAuth } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAuth();
  if (denied) return denied;

  const { id } = await params;
  const purchase = await db.query.purchases.findFirst({
    where: eq(purchases.id, Number(id)),
    with: {
      lineItems: true,
      participants: { with: { friend: true } },
      debts: { with: { friend: true } },
    },
  });
  if (!purchase)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(purchase);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAuth();
  if (denied) return denied;

  const { id } = await params;
  const purchaseId = Number(id);
  const body = await req.json();
  const parsed = updatePurchaseSchema.safeParse(body);

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
  const nParticipants = friendIds.length + 1;
  const share = perPersonShare(total, nParticipants);

  // Update purchase
  await db
    .update(purchases)
    .set({
      title,
      note: note?.trim() || null,
      date,
      total: total.toFixed(2),
      updatedAt: new Date(),
    })
    .where(eq(purchases.id, purchaseId));

  // Replace line items
  await db.delete(lineItems).where(eq(lineItems.purchaseId, purchaseId));
  await db.insert(lineItems).values(
    lineItemsInput.map((item) => ({
      purchaseId,
      name: item.name,
      quantity: item.quantity.toString(),
      unitPrice: item.unitPrice.toFixed(2),
      subtotal: (item.quantity * item.unitPrice).toFixed(2),
    }))
  );

  // Replace participants (friends only — "you" is always implicit)
  await db
    .delete(purchaseParticipants)
    .where(eq(purchaseParticipants.purchaseId, purchaseId));
  await db.insert(purchaseParticipants).values(
    friendIds.map((fid) => ({ purchaseId, friendId: fid }))
  );

  // Replace debts
  await db.delete(debts).where(eq(debts.purchaseId, purchaseId));
  await db.insert(debts).values(
    friendIds.map((fid) => ({
      purchaseId,
      friendId: fid,
      amount: share.toFixed(2),
    }))
  );

  const updated = await db.query.purchases.findFirst({
    where: eq(purchases.id, purchaseId),
    with: {
      lineItems: true,
      participants: { with: { friend: true } },
      debts: { with: { friend: true } },
    },
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
  await db.delete(purchases).where(eq(purchases.id, Number(id)));
  return new NextResponse(null, { status: 204 });
}
