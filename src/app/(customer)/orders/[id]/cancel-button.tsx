"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { XCircle } from "lucide-react";

export function CancelButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");

  async function cancelOrder() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CANCEL" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to cancel order");
        setLoading(false);
        return;
      }
      setConfirming(false);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-rose-700 font-medium">Are you sure?</span>
        <Button
          type="button"
          variant="danger"
          className="!py-1.5 !px-3 !text-xs"
          onClick={cancelOrder}
          disabled={loading}
        >
          {loading ? "Cancelling…" : "Yes, cancel"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="!py-1.5 !px-3 !text-xs"
          onClick={() => setConfirming(false)}
          disabled={loading}
        >
          Nevermind
        </Button>
        {error ? <span className="text-xs text-rose-600">{error}</span> : null}
      </div>
    );
  }

  return (
    <div>
      <Button
        type="button"
        variant="ghost"
        className="!text-rose-600 hover:!bg-rose-50 !py-1.5 !px-2.5 !text-xs border border-rose-200/80"
        onClick={() => setConfirming(true)}
      >
        <XCircle className="h-3.5 w-3.5" />
        Cancel order
      </Button>
      {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
