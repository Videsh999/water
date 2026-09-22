"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Label, Select } from "@/components/ui";
import { formatINR } from "@/lib/utils";

type Product = { id: string; name: string; priceInPaise: number; emoji: string };
type Zone = { id: string; name: string };

export function OrderForm({
  products,
  zones,
  defaultAddress,
}: {
  products: Product[];
  zones: Zone[];
  defaultAddress: {
    line1: string;
    line2: string;
    landmark: string;
    pincode: string;
    zoneName: string;
  } | null;
}) {
  const router = useRouter();
  const [qty, setQty] = useState<Record<string, number>>(
    Object.fromEntries(products.map((p) => [p.id, p.name.includes("20L") ? 1 : 0]))
  );
  const [type, setType] = useState<"ONE_TIME" | "SUBSCRIPTION">("ONE_TIME");
  const [notes, setNotes] = useState("");
  const [line1, setLine1] = useState(defaultAddress?.line1 ?? "");
  const [line2, setLine2] = useState(defaultAddress?.line2 ?? "");
  const [landmark, setLandmark] = useState(defaultAddress?.landmark ?? "");
  const [pincode, setPincode] = useState(defaultAddress?.pincode ?? "500032");
  const [zoneName, setZoneName] = useState(
    defaultAddress?.zoneName ?? zones[0]?.name ?? "Gachibowli"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const items = useMemo(
    () =>
      products
        .filter((p) => (qty[p.id] || 0) > 0)
        .map((p) => ({ productId: p.id, quantity: qty[p.id], product: p })),
    [products, qty]
  );

  const total = items.reduce(
    (sum, i) => sum + i.product.priceInPaise * i.quantity,
    0
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!items.length) {
      setError("Select at least one product");
      return;
    }
    if (!line1.trim()) {
      setError("Enter your address");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          notes: notes || null,
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
          })),
          address: { line1, line2, landmark, pincode, zoneName },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Order failed");
        return;
      }
      router.push(`/orders/${data.id}`);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <h2 className="text-lg font-semibold text-slate-900">Place an order</h2>
      <p className="mt-1 text-sm text-slate-500">
        Payment is stubbed for now (marked as paid). Razorpay / UPI coming later.
      </p>

      <form onSubmit={submit} className="mt-5 space-y-5">
        <div className="space-y-3">
          {products.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5"
            >
              <div>
                <p className="font-medium text-slate-800">
                  {p.emoji} {p.name}
                </p>
                <p className="text-xs text-slate-500">{formatINR(p.priceInPaise)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="!px-3 !py-1.5"
                  onClick={() =>
                    setQty((q) => ({
                      ...q,
                      [p.id]: Math.max(0, (q[p.id] || 0) - 1),
                    }))
                  }
                >
                  −
                </Button>
                <span className="w-6 text-center font-semibold">{qty[p.id] || 0}</span>
                <Button
                  type="button"
                  variant="secondary"
                  className="!px-3 !py-1.5"
                  onClick={() =>
                    setQty((q) => ({ ...q, [p.id]: (q[p.id] || 0) + 1 }))
                  }
                >
                  +
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Order type</Label>
            <Select
              value={type}
              onChange={(e) =>
                setType(e.target.value as "ONE_TIME" | "SUBSCRIPTION")
              }
            >
              <option value="ONE_TIME">One-time</option>
              <option value="SUBSCRIPTION">Subscription (weekly)</option>
            </Select>
          </div>
          <div>
            <Label>Zone</Label>
            <Select value={zoneName} onChange={(e) => setZoneName(e.target.value)}>
              {zones.map((z) => (
                <option key={z.id} value={z.name}>
                  {z.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="line1">Address (Hyderabad)</Label>
          <Input
            id="line1"
            value={line1}
            onChange={(e) => setLine1(e.target.value)}
            placeholder="Flat / building / street"
            required
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="line2">Area / locality</Label>
            <Input
              id="line2"
              value={line2}
              onChange={(e) => setLine2(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div>
            <Label htmlFor="pincode">Pincode</Label>
            <Input
              id="pincode"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="landmark">Landmark</Label>
          <Input
            id="landmark"
            value={landmark}
            onChange={(e) => setLandmark(e.target.value)}
            placeholder="Optional"
          />
        </div>
        <div>
          <Label htmlFor="notes">Delivery notes</Label>
          <Input
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Gate code, preferred time…"
          />
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">Total (stub payment)</p>
            <p className="text-2xl font-bold text-slate-900">{formatINR(total)}</p>
          </div>
          <Button type="submit" disabled={loading || total === 0} className="sm:min-w-44">
            {loading ? "Placing…" : "Place order"}
          </Button>
        </div>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      </form>
    </Card>
  );
}
