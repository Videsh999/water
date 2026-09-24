import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { formatINR } from "@/lib/utils";
import { Card, PageHeader } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import { RefreshButton } from "@/components/refresh-button";
import { AssignDriver } from "./assign-driver";
import { Package, Users, Droplets, ExternalLink } from "lucide-react";

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/");

  const [orders, drivers, products, pendingCount] = await Promise.all([
    prisma.order
      .findMany({
        include: {
          customer: true,
          driver: true,
          address: { include: { zone: true } },
          items: { include: { product: true } },
        },
        orderBy: { createdAt: "desc" },
      })
      .catch(() => []),
    prisma.user
      .findMany({
        where: { role: "DRIVER" },
        include: { zone: true },
        orderBy: { name: "asc" },
      })
      .catch(() => []),
    prisma.product.findMany({ orderBy: { sortOrder: "asc" } }).catch(() => []),
    prisma.order.count({ where: { status: "PENDING" } }).catch(() => 0),
  ]);

  return (
    <div>
      <PageHeader
        title="Admin"
        subtitle="Orders, driver assignment & inventory-lite."
        action={<RefreshButton label="Refresh dashboard" />}
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Card className="flex items-center gap-3 !py-4">
          <Package className="h-8 w-8 text-amber-500" />
          <div>
            <p className="text-2xl font-bold">{pendingCount}</p>
            <p className="text-xs text-slate-500">Pending assignment</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 !py-4">
          <Users className="h-8 w-8 text-sky-500" />
          <div>
            <p className="text-2xl font-bold">{drivers.length}</p>
            <p className="text-xs text-slate-500">Active drivers</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 !py-4">
          <Droplets className="h-8 w-8 text-cyan-500" />
          <div>
            <p className="text-2xl font-bold">{products.length}</p>
            <p className="text-xs text-slate-500">Catalog SKUs</p>
          </div>
        </Card>
      </div>

      <Card className="mb-6">
        <h2 className="mb-3 font-semibold text-slate-900">Inventory-lite</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-400">
              <tr>
                <th className="pb-2 pr-4">Product</th>
                <th className="pb-2 pr-4">Unit</th>
                <th className="pb-2">Price</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="py-2.5 pr-4">
                    {p.emoji} {p.name}
                  </td>
                  <td className="py-2.5 pr-4 text-slate-500">{p.unit}</td>
                  <td className="py-2.5 font-medium">
                    {formatINR(p.priceInPaise)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <h2 className="mb-3 text-lg font-semibold text-slate-900">Orders</h2>
      {orders.length === 0 ? (
        <Card>
          <p className="text-slate-500">No orders yet. When a customer places an order, it will show up here for assignment.</p>
        </Card>
      ) : (
      <div className="space-y-3">
        {orders.map((o) => (
          <Card key={o.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-900">
                    {o.customer.name}
                    <span className="ml-2 text-xs font-normal text-slate-400">
                      {o.customer.phone}
                    </span>
                  </p>
                  <Link
                    href={`/orders/${o.id}`}
                    className="inline-flex items-center gap-1 rounded bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700 hover:bg-sky-100"
                    title="View live order tracking"
                  >
                    <span>#{o.id.slice(0, 6)}</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {o.items
                    .map((i) => `${i.quantity}× ${i.product.name}`)
                    .join(", ")}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {o.address?.line1 ?? "Address"}, {o.address?.zone?.name ?? "Hyderabad"} ·{" "}
                  {o.type === "SUBSCRIPTION" ? "Subscription" : "One-time"} ·{" "}
                  {formatINR(o.totalInPaise)}
                </p>
                {o.driver ? (
                  <p className="mt-1 text-xs text-sky-700">
                    Driver: {o.driver.name}
                  </p>
                ) : null}
              </div>
              <StatusBadge status={o.status} />
            </div>

            {(o.status === "PENDING" || o.status === "ASSIGNED" || o.status === "OUT_FOR_DELIVERY") && (
              <div className="mt-4 border-t border-slate-100 pt-3">
                <AssignDriver
                  orderId={o.id}
                  drivers={drivers.map((d) => ({
                    id: d.id,
                    name: d.name,
                    zone: d.zone?.name ?? null,
                  }))}
                  currentDriverId={o.driverId}
                />
              </div>
            )}
          </Card>
        ))}
      </div>
      )}
    </div>
  );
}
