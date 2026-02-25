"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteFriendButton({ id, name }: { id: number; name: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);

  async function handleDelete() {
    const res = await fetch(`/api/friends/${id}`, { method: "DELETE" });
    if (res.status === 409) {
      const data = await res.json();
      setError(data.error);
      setConfirming(false);
      return;
    }
    router.push("/friends");
    router.refresh();
  }

  if (error) {
    return <p className="text-xs text-red-500">{error}</p>;
  }

  if (confirming) {
    return (
      <div className="flex gap-2">
        <button onClick={handleDelete} className="text-sm text-white bg-red-500 px-3 py-1.5 rounded-lg hover:bg-red-600">
          Confirm delete
        </button>
        <button onClick={() => setConfirming(false)} className="text-sm text-gray-500 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50">
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button onClick={() => setConfirming(true)} className="text-sm text-gray-400 hover:text-red-500 transition-colors">
      Delete {name}
    </button>
  );
}
