"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { perPersonShare } from "@/lib/math";

interface LineItemRow {
  id: string; // local key
  name: string;
  quantity: string;
  unitPrice: string;
}

interface Friend {
  id: number;
  name: string;
}

interface Group {
  id: number;
  name: string;
  groupMembers: { friend: Friend }[];
}

interface PurchaseFormProps {
  initialData?: {
    id: number;
    title: string;
    note: string | null;
    date: string;
    lineItems: { name: string; quantity: string; unitPrice: string }[];
    friendIds: number[];
  };
}

export default function PurchaseForm({ initialData }: PurchaseFormProps) {
  const router = useRouter();
  const isEdit = !!initialData;

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [note, setNote] = useState(initialData?.note ?? "");
  const [date, setDate] = useState(
    initialData?.date ?? new Date().toISOString().split("T")[0]
  );
  const [lineItems, setLineItems] = useState<LineItemRow[]>(
    initialData?.lineItems.length
      ? initialData.lineItems.map((li, i) => ({
          id: String(i),
          name: li.name,
          quantity: li.quantity,
          unitPrice: li.unitPrice,
        }))
      : [{ id: "0", name: "", quantity: "1", unitPrice: "" }]
  );
  const [selectedFriendIds, setSelectedFriendIds] = useState<Set<number>>(
    new Set(initialData?.friendIds ?? [])
  );
  const [friends, setFriends] = useState<Friend[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/friends").then((r) => r.json()),
      fetch("/api/groups").then((r) => r.json()),
    ]).then(([f, g]) => {
      setFriends(f);
      setGroups(g);
    });
  }, []);

  // Computed totals
  const total = lineItems.reduce((sum, li) => {
    const qty = parseFloat(li.quantity) || 0;
    const price = parseFloat(li.unitPrice) || 0;
    return sum + qty * price;
  }, 0);

  const nParticipants = selectedFriendIds.size + 1; // friends + you
  const share =
    selectedFriendIds.size > 0 ? perPersonShare(total, nParticipants) : 0;

  function addLineItem() {
    setLineItems((prev) => [
      ...prev,
      { id: String(Date.now()), name: "", quantity: "1", unitPrice: "" },
    ]);
  }

  function removeLineItem(id: string) {
    setLineItems((prev) => prev.filter((li) => li.id !== id));
  }

  function updateLineItem(id: string, field: keyof LineItemRow, value: string) {
    setLineItems((prev) =>
      prev.map((li) => (li.id === id ? { ...li, [field]: value } : li))
    );
  }

  function toggleFriend(friendId: number) {
    setSelectedFriendIds((prev) => {
      const next = new Set(prev);
      if (next.has(friendId)) next.delete(friendId);
      else next.add(friendId);
      return next;
    });
  }

  function selectGroup(group: Group) {
    setSelectedFriendIds((prev) => {
      const next = new Set(prev);
      group.groupMembers.forEach((gm) => next.add(gm.friend.id));
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!title.trim()) return setError("Title is required");
    if (lineItems.some((li) => !li.name.trim() || !li.unitPrice))
      return setError("All line items need a name and price");
    if (selectedFriendIds.size === 0)
      return setError("Select at least one friend");

    setSaving(true);
    const payload = {
      title,
      note,
      date,
      lineItemsInput: lineItems.map((li) => ({
        name: li.name,
        quantity: parseFloat(li.quantity) || 1,
        unitPrice: parseFloat(li.unitPrice) || 0,
      })),
      friendIds: Array.from(selectedFriendIds),
    };

    const url = isEdit
      ? `/api/purchases/${initialData!.id}`
      : "/api/purchases";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      return setError(data.error ?? "Something went wrong");
    }

    const data = await res.json();
    router.push(`/purchases/${data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          placeholder="What did you buy?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      {/* Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
        <input
          type="date"
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {/* Note */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
        <input
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          placeholder="Any notes..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      {/* Line items */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Items</label>
        <div className="space-y-2">
          {lineItems.map((li) => {
            const subtotal =
              (parseFloat(li.quantity) || 0) * (parseFloat(li.unitPrice) || 0);
            return (
              <div key={li.id} className="flex gap-2 items-start">
                <input
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="Item name"
                  value={li.name}
                  onChange={(e) => updateLineItem(li.id, "name", e.target.value)}
                />
                <input
                  className="w-14 border border-gray-200 rounded-xl px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="Qty"
                  type="number"
                  min="0"
                  step="any"
                  value={li.quantity}
                  onChange={(e) => updateLineItem(li.id, "quantity", e.target.value)}
                />
                <input
                  className="w-20 border border-gray-200 rounded-xl px-2 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="Price"
                  type="number"
                  min="0"
                  step="any"
                  value={li.unitPrice}
                  onChange={(e) => updateLineItem(li.id, "unitPrice", e.target.value)}
                />
                <div className="w-16 text-right text-sm text-gray-500 py-2">
                  {subtotal > 0 ? subtotal.toFixed(2) : "—"}
                </div>
                {lineItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLineItem(li.id)}
                    className="text-gray-300 hover:text-red-400 py-2 px-1 text-lg"
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <button
          type="button"
          onClick={addLineItem}
          className="mt-2 text-sm text-indigo-500 hover:text-indigo-700"
        >
          + Add item
        </button>

        {/* Running total */}
        <div className="mt-3 flex justify-between text-sm font-medium border-t border-gray-100 pt-2">
          <span>Total</span>
          <span>{total.toFixed(2)}</span>
        </div>
      </div>

      {/* Participants */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Split with</label>

        {/* Groups quick-add */}
        {groups.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {groups.map((g) => (
              <button
                type="button"
                key={g.id}
                onClick={() => selectGroup(g)}
                className="text-xs bg-gray-100 hover:bg-indigo-100 text-gray-600 hover:text-indigo-700 px-2 py-1 rounded-lg transition-colors"
              >
                {g.name}
              </button>
            ))}
          </div>
        )}

        {/* Friend chips */}
        <div className="flex flex-wrap gap-2">
          {/* You — always included, fixed */}
          <span className="flex items-center gap-1 bg-indigo-100 text-indigo-700 text-sm px-3 py-1 rounded-full">
            You
          </span>
          {friends.map((f) => {
            const selected = selectedFriendIds.has(f.id);
            return (
              <button
                type="button"
                key={f.id}
                onClick={() => toggleFriend(f.id)}
                className={`text-sm px-3 py-1 rounded-full border transition-colors ${
                  selected
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
                }`}
              >
                {f.name}
                {selected && " ×"}
              </button>
            );
          })}
        </div>

        {/* Per-person share */}
        {selectedFriendIds.size > 0 && (
          <p className="mt-3 text-sm text-gray-500">
            {nParticipants} people &mdash; each pays{" "}
            <span className="font-semibold text-gray-800">{share.toFixed(2)}</span>
          </p>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
      >
        {saving ? "Saving..." : isEdit ? "Save changes" : "Save purchase"}
      </button>
    </form>
  );
}
