"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, X } from "lucide-react";

export default function DiscordIdForm({
  friendId,
  currentDiscordId,
}: {
  friendId: number;
  currentDiscordId: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [discordId, setDiscordId] = useState(currentDiscordId ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function save(value: string | null) {
    setSaving(true);
    setError("");
    const res = await fetch(`/api/friends/${friendId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ discordId: value }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to update");
      return;
    }
    setEditing(false);
    router.refresh();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = discordId.trim();
    if (!trimmed) return setError("Discord ID cannot be empty");
    await save(trimmed);
  }

  async function handleRemove() {
    setDiscordId("");
    await save(null);
  }

  if (editing) {
    return (
      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          type="text"
          value={discordId}
          onChange={(e) => setDiscordId(e.target.value)}
          placeholder="Discord ID"
          autoFocus
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setDiscordId(currentDiscordId ?? "");
              setError("");
            }}
            className="px-4 py-2 rounded-xl text-sm border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  if (currentDiscordId) {
    return (
      <div className="flex items-center gap-2">
        <p className="text-xs text-gray-400">Discord: {currentDiscordId}</p>
        <button
          onClick={() => setEditing(true)}
          className="text-gray-400 hover:text-indigo-600 transition-colors"
          title="Edit Discord ID"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleRemove}
          disabled={saving}
          className="text-gray-400 hover:text-red-500 disabled:opacity-50 transition-colors"
          title="Remove Discord ID"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setEditing(true)}
        className="text-xs text-indigo-500 hover:text-indigo-700 transition-colors"
      >
        Link Discord
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </>
  );
}
