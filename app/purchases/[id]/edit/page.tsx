export const dynamic = "force-dynamic";
import { db } from "@/db";
import { purchases } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import PurchaseForm from "@/components/PurchaseForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function EditPurchasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const purchase = await db.query.purchases.findFirst({
    where: eq(purchases.id, Number(id)),
    with: {
      lineItems: true,
      participants: { with: { friend: true } },
    },
  });

  if (!purchase) notFound();

  const friendIds = purchase.participants.map((p) => p.friendId);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/purchases/${id}`}
          className="text-gray-400 hover:text-gray-700"
        >
          <ArrowLeft />
        </Link>
        <h1 className="text-xl font-bold">Edit Purchase</h1>
      </div>
      <PurchaseForm
        initialData={{
          id: purchase.id,
          title: purchase.title,
          note: purchase.note,
          date: purchase.date,
          lineItems: purchase.lineItems.map((li) => ({
            name: li.name,
            quantity: li.quantity,
            unitPrice: li.unitPrice,
          })),
          friendIds,
        }}
      />
    </div>
  );
}
