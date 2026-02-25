"use client";
import { useRouter } from "next/navigation";

export default function DeletePaymentButton({ id }: { id: number }) {
  const router = useRouter();

  async function handleDelete() {
    await fetch(`/api/payments/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      className="text-xs text-gray-300 hover:text-red-400 transition-colors"
      title="Delete payment"
    >
      ×
    </button>
  );
}
