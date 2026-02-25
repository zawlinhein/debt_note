export const dynamic = "force-dynamic";
import { db } from "@/db";
import Link from "next/link";
import CreateGroupForm from "@/components/CreateGroupForm";

export default async function GroupsPage() {
  const allGroups = await db.query.groups.findMany({
    with: { groupMembers: { with: { friend: true } } },
    orderBy: (g, { asc }) => [asc(g.name)],
  });

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Groups</h1>

      {allGroups.length === 0 ? (
        <p className="text-sm text-gray-400 py-8 text-center">No groups yet.</p>
      ) : (
        <div className="space-y-3 mb-6">
          {allGroups.map((g) => (
            <Link
              key={g.id}
              href={`/groups/${g.id}`}
              className="block bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-indigo-200 transition-colors"
            >
              <p className="font-medium">{g.name}</p>
              <p className="text-xs text-gray-400 mt-1">
                {g.groupMembers.map((gm) => gm.friend.name).join(", ") || "No members"}
              </p>
            </Link>
          ))}
        </div>
      )}

      <CreateGroupForm />
    </div>
  );
}
