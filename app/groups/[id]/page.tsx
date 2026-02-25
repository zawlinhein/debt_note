export const dynamic = "force-dynamic";
import { db } from "@/db";
import { groups } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import GroupEditForm from "@/components/GroupEditForm";
import { ArrowLeft } from "lucide-react";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const group = await db.query.groups.findFirst({
    where: eq(groups.id, Number(id)),
    with: { groupMembers: { with: { friend: true } } },
  });
  if (!group) notFound();

  const memberIds = group.groupMembers.map((gm) => gm.friendId);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/groups" className="text-gray-400 hover:text-gray-700">
          <ArrowLeft />
        </Link>
        <h1 className="text-xl font-bold">{group.name}</h1>
      </div>
      <GroupEditForm
        groupId={group.id}
        initialName={group.name}
        initialMemberIds={memberIds}
      />
    </div>
  );
}
