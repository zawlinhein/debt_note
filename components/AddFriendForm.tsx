"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddFriendForm() {
  const [name, setName] = useState("");
  const [discordId, setDiscordId] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    const res = await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        ...(discordId.trim() ? { discordId: discordId.trim() } : {}),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      return setError(data.error ?? "Failed to add");
    }
    setName("");
    setDiscordId("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 mt-4">
      <div className="flex gap-2">
        <input
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          placeholder="Friend's name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          type="submit"
          disabled={saving}
          className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          Add
        </button>
      </div>
      <input
        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        placeholder="Discord ID (optional)"
        value={discordId}
        onChange={(e) => setDiscordId(e.target.value)}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </form>
  );
}
