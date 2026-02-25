export const dynamic = "force-dynamic";
import { db } from "@/db";
import { debts, payments } from "@/db/schema";
import { eq, sum } from "drizzle-orm";
import Link from "next/link";
import AddFriendForm from "@/components/AddFriendForm";

async function getFriends() {
  const allFriends = await db.query.friends.findMany({
    orderBy: (f, { asc }) => [asc(f.name)],
  });
  return Promise.all(
    allFriends.map(async (f) => {
      const [owed] = await db.select({ total: sum(debts.amount) }).from(debts).where(eq(debts.friendId, f.id));
      const [paid] = await db.select({ total: sum(payments.amount) }).from(payments).where(eq(payments.friendId, f.id));
      const totalOwed = Number(owed?.total ?? 0);
      const totalPaid = Number(paid?.total ?? 0);
      return { ...f, totalOwed, totalPaid, remaining: totalOwed - totalPaid };
    })
  );
}

export default async function FriendsPage() {
  const friends = await getFriends();

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Friends</h1>

      {friends.length === 0 ? (
        <p className="text-sm text-gray-400 py-8 text-center">No friends yet.</p>
      ) : (
        <div className="space-y-3">
          {friends.map((f) => (
            <Link
              key={f.id}
              href={`/friends/${f.id}`}
              className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-indigo-200 transition-colors"
            >
              <span className="font-medium">{f.name}</span>
              <span
                className={`text-base font-semibold ${
                  f.remaining > 0 ? "text-orange-500" : f.remaining < 0 ? "text-indigo-500" : "text-green-500"
                }`}
              >
                {f.remaining.toFixed(2)}
              </span>
            </Link>
          ))}
        </div>
      )}

      <AddFriendForm />
    </div>
  );
}
