import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { createPaymentSchema } from "@/lib/validations";
import { requireAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const denied = await requireAuth();
  if (denied) return denied;

  const body = await req.json();
  const parsed = createPaymentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { friendId, amount, note, paidAt } = parsed.data;

  const [payment] = await db
    .insert(payments)
    .values({
      friendId,
      amount: amount.toFixed(2),
      note: note?.trim() || null,
      paidAt: paidAt || new Date().toISOString().split("T")[0],
    })
    .returning();

  return NextResponse.json(payment, { status: 201 });
}
