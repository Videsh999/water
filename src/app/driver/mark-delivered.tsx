"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { Check, Truck } from "lucide-react";

export function MarkDelivered({
  orderId,
  status,
}: {
  orderId: string;
  status: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isStart = status === "ASSIGNED";

  async function mark() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/orders/${orderId}/deliver`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Button type="button" onClick={mark} disabled={loading} className="w-full sm:w-auto">
        {isStart ? <Truck className="h-4 w-4" /> : <Check className="h-4 w-4" />}
        {loading
          ? "Updating…"
          : isStart
            ? "Start delivery"
            : "Mark delivered"}
      </Button>
      {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}
    </div>
  );
}
