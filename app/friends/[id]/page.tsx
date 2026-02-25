export const dynamic = "force-dynamic";
import { db } from "@/db";
import { friends, debts, payments } from "@/db/schema";
import { eq, sum } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import RecordPaymentForm from "@/components/RecordPaymentForm";
import DeletePaymentButton from "@/components/DeletePaymentButton";
import DeleteFriendButton from "@/components/DeleteFriendButton";
import DiscordIdForm from "@/components/DiscordIdForm";
import { ArrowLeft } from "lucide-react";

export default async function FriendDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const friendId = Number(id);

  const friend = await db.query.friends.findFirst({
    where: eq(friends.id, friendId),
  });
  if (!friend) notFound();

  const [owed] = await db
    .select({ total: sum(debts.amount) })
    .from(debts)
    .where(eq(debts.friendId, friendId));
  const [paid] = await db
    .select({ total: sum(payments.amount) })
    .from(payments)
    .where(eq(payments.friendId, friendId));
  const totalOwed = Number(owed?.total ?? 0);
  const totalPaid = Number(paid?.total ?? 0);
  const remaining = totalOwed - totalPaid;

  const friendDebts = await db.query.debts.findMany({
    where: eq(debts.friendId, friendId),
    with: { purchase: true },
    orderBy: (d, { desc }) => [desc(d.createdAt)],
  });

  const friendPayments = await db.query.payments.findMany({
    where: eq(payments.friendId, friendId),
    orderBy: (p, { desc }) => [desc(p.paidAt), desc(p.createdAt)],
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/friends" className="text-gray-400 hover:text-gray-700">
          <ArrowLeft />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{friend.name}</h1>
          <DiscordIdForm friendId={friendId} currentDiscordId={friend.discordId} />
        </div>
      </div>

      {/* Balance card */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs text-gray-400 mb-1">Owed</p>
            <p className="font-semibold text-gray-800">
              {totalOwed.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Paid</p>
            <p className="font-semibold text-green-600">
              {totalPaid.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Remaining</p>
            <p
              className={`font-bold text-lg ${remaining > 0 ? "text-orange-500" : remaining < 0 ? "text-indigo-500" : "text-green-500"}`}
            >
              {remaining.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Record payment */}
      <RecordPaymentForm friendId={friendId} />

      {/* Purchases */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Purchases
        </h2>
        {friendDebts.length === 0 ? (
          <p className="text-sm text-gray-400">No purchases yet.</p>
        ) : (
          <div className="space-y-2">
            {friendDebts.map((d) => (
              <Link
                key={d.id}
                href={`/purchases/${d.purchaseId}`}
                className="flex items-center justify-between bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100 hover:border-indigo-200 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">{d.purchase.title}</p>
                  <p className="text-xs text-gray-400">{d.purchase.date}</p>
                </div>
                <span className="text-sm font-semibold text-orange-500">
                  {Number(d.amount).toFixed(2)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Payments */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Payment history
        </h2>
        {friendPayments.length === 0 ? (
          <p className="text-sm text-gray-400">No payments yet.</p>
        ) : (
          <div className="space-y-2">
            {friendPayments.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100"
              >
                <div>
                  <p className="text-sm font-semibold text-green-600">
                    +{Number(p.amount).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {p.paidAt}
                    {p.note ? ` · ${p.note}` : ""}
                  </p>
                </div>
                <DeletePaymentButton id={p.id} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete friend */}
      <div className="pt-4 border-t border-gray-100">
        <DeleteFriendButton id={friendId} name={friend.name} />
      </div>
    </div>
  );
}
