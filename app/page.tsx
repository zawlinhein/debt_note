export const dynamic = "force-dynamic";
import { db } from "@/db";
import { debts, payments } from "@/db/schema";
import { eq, sum } from "drizzle-orm";
import Link from "next/link";

async function getFriendBalances() {
  const allFriends = await db.query.friends.findMany({
    orderBy: (f, { asc }) => [asc(f.name)],
  });

  const results = await Promise.all(
    allFriends.map(async (f) => {
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
      return { ...f, totalOwed, totalPaid, remaining: totalOwed - totalPaid };
    }),
  );

  return results.sort((a, b) => b.remaining - a.remaining);
}

export default async function DashboardPage() {
  const friends = await getFriendBalances();
  const grandTotal = friends.reduce((s, f) => s + Math.max(0, f.remaining), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">DebtNote</h1>
        <Link
          href="/purchases/new"
          className="bg-indigo-600 text-white text-sm px-3 py-1.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          + Purchase
        </Link>
      </div>

      {/* Grand total banner */}
      <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm border border-gray-100">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
          Total outstanding
        </p>
        <p className="text-3xl font-bold text-gray-900">
          {grandTotal.toFixed(0)}
        </p>
      </div>

      {/* Friend cards */}
      {friends.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-sm">No friends yet.</p>
          <Link
            href="/friends"
            className="text-indigo-500 text-sm underline mt-1 inline-block"
          >
            Add a friend
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {friends.map((f) => (
            <Link
              key={f.id}
              href={`/friends/${f.id}`}
              className="block bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-indigo-200 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{f.name}</span>
                <span
                  className={`text-lg font-semibold ${
                    f.remaining > 0
                      ? "text-orange-500"
                      : f.remaining < 0
                        ? "text-indigo-500"
                        : "text-green-500"
                  }`}
                >
                  {f.remaining.toFixed(0)}
                </span>
              </div>
              <div className="flex gap-4 mt-1 text-xs text-gray-400">
                <span>Owed {f.totalOwed.toFixed(0)}</span>
                <span>Paid {f.totalPaid.toFixed(0)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
