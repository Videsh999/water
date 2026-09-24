import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { formatINR } from "@/lib/utils";
import { Button, Card, PageHeader } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import { RefreshButton } from "@/components/refresh-button";
import { CancelButton } from "./cancel-button";
import { CheckCircle2, Circle, Truck } from "lucide-react";

const STEPS = ["PENDING", "ASSIGNED", "OUT_FOR_DELIVERY", "DELIVERED"] as const;

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const order = await prisma.order.findFirst({
    where:
      user.role === "ADMIN"
        ? { id }
        : user.role === "DRIVER"
          ? { id, driverId: user.id }
          : { id, customerId: user.id },
    include: {
      address: { include: { zone: true } },
      items: { include: { product: true } },
      driver: true,
      customer: true,
    },
  });
  if (!order) notFound();

  const currentIdx =
    order.status === "CANCELLED"
      ? -1
      : Math.max(0, STEPS.indexOf(order.status as (typeof STEPS)[number]));

  const backHref =
    user.role === "ADMIN" ? "/admin" : user.role === "DRIVER" ? "/driver" : "/orders";
  const backLabel =
    user.role === "ADMIN" ? "Admin orders" : user.role === "DRIVER" ? "Deliveries" : "My orders";

  return (
    <div>
      <PageHeader
        title="Order tracking"
        subtitle={`Order ${order.id.slice(0, 8)}…`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {order.status === "PENDING" && (user.role === "CUSTOMER" || user.role === "ADMIN") ? (
              <CancelButton orderId={order.id} />
            ) : null}
            <RefreshButton label="Refresh status" />
            <Link href={backHref}>
              <Button variant="secondary">{backLabel}</Button>
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Status</h2>
            <StatusBadge status={order.status} />
          </div>

          {order.status === "CANCELLED" ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
              <p className="font-medium text-rose-800">Order cancelled</p>
              <p className="mt-1 text-xs text-rose-600">
                This delivery was cancelled. You can place a new order anytime.
              </p>
            </div>
          ) : (
            <ol className="space-y-4">
              {STEPS.map((step, idx) => {
                const done = idx <= currentIdx;
                const active = idx === currentIdx;
                return (
                  <li key={step} className="flex gap-3">
                    {done ? (
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                    ) : (
                      <Circle className="mt-0.5 h-5 w-5 shrink-0 text-slate-300" />
                    )}
                    <div>
                      <p
                        className={
                          active
                            ? "font-semibold text-sky-700"
                            : done
                              ? "font-medium text-slate-800"
                              : "text-slate-400"
                        }
                      >
                        {step === "PENDING"
                          ? "Order placed"
                          : step === "ASSIGNED"
                            ? "Driver assigned"
                            : step === "OUT_FOR_DELIVERY"
                              ? "Out for delivery"
                              : "Delivered"}
                      </p>
                      {step === "ASSIGNED" && order.driver ? (
                        <p className="text-sm text-slate-500">
                          {order.driver.name}
                          {order.driver.phone ? ` · ${order.driver.phone}` : ""}
                        </p>
                      ) : null}
                      {step === "DELIVERED" && order.deliveredAt ? (
                        <p className="text-sm text-slate-500">
                          {new Date(order.deliveredAt).toLocaleString("en-IN", {
                            timeZone: "Asia/Kolkata",
                          })}
                        </p>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </Card>

        <Card className="lg:col-span-2 space-y-4">
          {user.role !== "CUSTOMER" ? (
            <div>
              <h3 className="text-sm font-semibold text-slate-500">Customer</h3>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {order.customer.name}
              </p>
              {order.customer.phone ? (
                <p className="text-xs text-slate-500">{order.customer.phone}</p>
              ) : null}
              {order.customer.email ? (
                <p className="text-xs text-slate-400">{order.customer.email}</p>
              ) : null}
            </div>
          ) : null}

          <div>
            <h3 className="text-sm font-semibold text-slate-500">Items</h3>
            <ul className="mt-2 space-y-1 text-sm">
              {order.items.map((i) => (
                <li key={i.id} className="flex justify-between">
                  <span>
                    {i.quantity}× {i.product.name}
                  </span>
                  <span>{formatINR(i.priceInPaise * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 flex justify-between border-t border-slate-100 pt-2 font-semibold">
              <span>Total</span>
              <span className="text-sky-700">{formatINR(order.totalInPaise)}</span>
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-500">Deliver to</h3>
            <p className="mt-1 text-sm text-slate-800">
              {order.address?.line1 ?? "Address"}
              {order.address?.line2 ? `, ${order.address.line2}` : ""}
              <br />
              {order.address?.zone?.name ?? "Hyderabad"}, Hyderabad{" "}
              {order.address?.pincode ?? ""}
            </p>
            {order.notes ? (
              <p className="mt-1 text-xs italic text-amber-700">Note: {order.notes}</p>
            ) : null}
          </div>

          <div className="rounded-xl bg-sky-50 px-3 py-2 text-xs text-sky-800">
            <Truck className="mb-1 inline h-3.5 w-3.5" /> {order.paymentNote}
          </div>
        </Card>
      </div>
    </div>
  );
}
