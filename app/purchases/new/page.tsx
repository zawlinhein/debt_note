import PurchaseForm from "@/components/PurchaseForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewPurchasePage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="text-gray-400 hover:text-gray-700">
          <ArrowLeft />
        </Link>
        <h1 className="text-xl font-bold">New Purchase</h1>
      </div>
      <PurchaseForm />
    </div>
  );
}
