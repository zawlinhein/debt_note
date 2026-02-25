"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Friend {
  id: number;
  name: string;
}

interface GroupEditFormProps {
  groupId: number;
  initialName: string;
  initialMemberIds: number[];
}

export default function GroupEditForm({ groupId, initialName, initialMemberIds }: GroupEditFormProps) {
  const [name, setName] = useState(initialName);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set(initialMemberIds));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/friends").then((r) => r.json()).then(setFriends);
  }, []);

  function toggle(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError("Name is required");
    setSaving(true);
    setError("");
    const res = await fetch(`/api/groups/${groupId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, friendIds: Array.from(selectedIds) }),
    });
    setSaving(false);
    if (!res.ok) return setError("Failed to save");
    router.push("/groups");
    router.refresh();
  }

  async function handleDelete() {
    setDeleting(true);
    await fetch(`/api/groups/${groupId}`, { method: "DELETE" });
    router.push("/groups");
    router.refresh();
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
        <input
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Members</label>
        <div className="flex flex-wrap gap-2">
          {friends.map((f) => (
            <button
              type="button"
              key={f.id}
              onClick={() => toggle(f.id)}
              className={`text-sm px-3 py-1 rounded-full border transition-colors ${
                selectedIds.has(f.id)
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
              }`}
            >
              {f.name}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save changes"}
      </button>

      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="w-full text-sm text-red-400 hover:text-red-600 py-2"
      >
        {deleting ? "Deleting..." : "Delete group"}
      </button>
    </form>
  );
}
