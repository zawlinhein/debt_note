"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RecordPaymentForm({ friendId }: { friendId: number }) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [paidAt, setPaidAt] = useState(new Date().toISOString().split("T")[0]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return setError("Enter a valid amount");
    setSaving(true);
    setError("");
    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friendId, amount: amt, note, paidAt }),
    });
    setSaving(false);
    if (!res.ok) return setError("Failed to record payment");
    setAmount("");
    setNote("");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full bg-green-500 text-white py-3 rounded-xl font-medium hover:bg-green-600 transition-colors"
      >
        Record payment
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
      <h3 className="font-medium text-sm text-gray-700">Record payment</h3>
      <input
        type="number"
        min="0"
        step="1"
        placeholder="Amount"
        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        autoFocus
      />
      <input
        type="date"
        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
        value={paidAt}
        onChange={(e) => setPaidAt(e.target.value)}
      />
      <input
        placeholder="Note (optional)"
        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 bg-green-500 text-white py-2 rounded-xl text-sm font-medium hover:bg-green-600 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 py-2 rounded-xl text-sm border border-gray-200 text-gray-500 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
