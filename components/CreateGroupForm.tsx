"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Friend {
  id: number;
  name: string;
}

export default function CreateGroupForm() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (open) fetch("/api/friends").then((r) => r.json()).then(setFriends);
  }, [open]);

  function toggle(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError("Name is required");
    setSaving(true);
    setError("");
    const res = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, friendIds: Array.from(selectedIds) }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      return setError(data.error ?? "Failed");
    }
    setName("");
    setSelectedIds(new Set());
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full border-2 border-dashed border-gray-200 text-gray-400 hover:border-indigo-300 hover:text-indigo-500 py-3 rounded-2xl text-sm transition-colors"
      >
        + New group
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
      <h3 className="font-medium text-sm">New group</h3>
      <input
        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        placeholder="Group name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
      />
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
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
          {saving ? "Saving..." : "Create"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-xl text-sm border border-gray-200 text-gray-500 hover:bg-gray-50">
          Cancel
        </button>
      </div>
    </form>
  );
}
