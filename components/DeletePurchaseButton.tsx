"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeletePurchaseButton({ id }: { id: number }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  async function handleDelete() {
    await fetch(`/api/purchases/${id}`, { method: "DELETE" });
    router.push("/");
    router.refresh();
  }

  if (confirming) {
    return (
      <div className="flex gap-2">
        <button
          onClick={handleDelete}
          className="text-sm text-white bg-red-500 px-3 py-1.5 rounded-lg hover:bg-red-600"
        >
          Confirm delete
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-sm text-gray-500 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-sm text-red-400 hover:text-red-600"
    >
      Delete
    </button>
  );
}
