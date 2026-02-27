export const dynamic = "force-dynamic";
import { db } from "@/db";
import { purchases } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import DeletePurchaseButton from "@/components/DeletePurchaseButton";
import { ArrowLeft } from "lucide-react";

export default async function PurchaseDetailPage({
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
      debts: { with: { friend: true } },
    },
  });

  if (!purchase) notFound();

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="text-gray-400 hover:text-gray-700">
          <ArrowLeft />
        </Link>
        <h1 className="text-xl font-bold flex-1">{purchase.title}</h1>
        <Link
          href={`/purchases/${id}/edit`}
          className="text-sm text-indigo-500 hover:text-indigo-700"
        >
          Edit
        </Link>
        <DeletePurchaseButton id={purchase.id} />
      </div>

      {/* Meta */}
      <div className="text-sm text-gray-400 mb-2">{purchase.date}</div>
      {purchase.note && (
        <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3 mb-4">
          {purchase.note}
        </p>
      )}

      {/* Line items */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-4 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-4 py-2 text-gray-400 font-normal">
                Item
              </th>
              <th className="text-right px-4 py-2 text-gray-400 font-normal">
                Qty
              </th>
              <th className="text-right px-4 py-2 text-gray-400 font-normal">
                Price
              </th>
              <th className="text-right px-4 py-2 text-gray-400 font-normal">
                Sub
              </th>
            </tr>
          </thead>
          <tbody>
            {purchase.lineItems.map((li) => (
              <tr key={li.id} className="border-b border-gray-50">
                <td className="px-4 py-2">{li.name}</td>
                <td className="px-4 py-2 text-right text-gray-500">
                  {li.quantity}
                </td>
                <td className="px-4 py-2 text-right text-gray-500">
                  {Number(li.unitPrice).toFixed(2)}
                </td>
                <td className="px-4 py-2 text-right">
                  {Number(li.subtotal).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td
                colSpan={3}
                className="px-4 py-2 text-right font-medium text-gray-600"
              >
                Total
              </td>
              <td className="px-4 py-2 text-right font-bold">
                {Number(purchase.total).toFixed(0)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Split */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-sm font-medium text-gray-700">
            Split {purchase.debts.length + 1} ways &mdash; each{" "}
            <span className="font-bold">
              {purchase.debts[0]
                ? Number(purchase.debts[0].amount).toFixed(0)
                : "—"}
            </span>
          </p>
        </div>
        <div className="divide-y divide-gray-50">
          {/* You */}
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm font-medium text-indigo-600">You</span>
            <span className="text-sm text-gray-400">paid</span>
          </div>
          {/* Friends */}
          {purchase.debts.map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between px-4 py-3"
            >
              <Link
                href={`/friends/${d.friendId}`}
                className="text-sm font-medium hover:text-indigo-600"
              >
                {d.friend.name}
              </Link>
              <span className="text-sm font-semibold text-orange-500">
                owes {Number(d.amount).toFixed(0)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
