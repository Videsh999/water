"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Select } from "@/components/ui";

export function AssignDriver({
  orderId,
  drivers,
  currentDriverId,
}: {
  orderId: string;
  drivers: { id: string; name: string; zone: string | null }[];
  currentDriverId: string | null;
}) {
  const router = useRouter();
  const [driverId, setDriverId] = useState(currentDriverId ?? drivers[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);

  async function assign() {
    if (!driverId) return;
    setLoading(true);
    setError("");
    setOk(false);
    try {
      const res = await fetch(`/api/orders/${orderId}/assign`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Assign failed");
        return;
      }
      setOk(true);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (drivers.length === 0) {
    return (
      <p className="text-sm text-amber-700">
        No drivers seeded. Run <code className="rounded bg-amber-50 px-1">npm run db:seed</code>.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Select
        value={driverId}
        onChange={(e) => setDriverId(e.target.value)}
        className="sm:max-w-xs"
      >
        {drivers.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
            {d.zone ? ` (${d.zone})` : ""}
          </option>
        ))}
      </Select>
      <Button type="button" onClick={assign} disabled={loading || !driverId}>
        {loading ? "Assigning…" : currentDriverId ? "Reassign" : "Assign driver"}
      </Button>
      {ok ? <p className="text-sm text-emerald-600">Assigned</p> : null}
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </div>
  );
}
