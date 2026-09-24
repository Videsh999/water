import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { formatINR } from "@/lib/utils";
import { Card, PageHeader } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import { RefreshButton } from "@/components/refresh-button";
import { MarkDelivered } from "./mark-delivered";
import { MapPin, Phone, ExternalLink } from "lucide-react";

export default async function DriverPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "DRIVER") redirect("/");

  const orders = await prisma.order
    .findMany({
      where: { driverId: user.id },
      include: {
        customer: true,
        address: { include: { zone: true } },
        items: { include: { product: true } },
      },
      orderBy: { createdAt: "desc" },
    })
    .catch(() => []);

  const active = orders.filter((o) => o.status !== "DELIVERED" && o.status !== "CANCELLED");
  const done = orders.filter((o) => o.status === "DELIVERED");

  return (
    <div>
      <PageHeader
        title="My deliveries"
        subtitle={`Hi ${user.name} — mark stops as delivered when complete.`}
        action={<RefreshButton label="Refresh deliveries" />}
      />

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
        Active ({active.length})
      </h2>
      {active.length === 0 ? (
        <Card className="mb-6">
          <p className="text-slate-500">No active deliveries. Check back after admin assigns you.</p>
        </Card>
      ) : (
        <div className="mb-8 space-y-3">
          {active.map((o) => (
            <Card key={o.id}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900">{o.customer.name}</p>
                    <Link
                      href={`/orders/${o.id}`}
                      className="inline-flex items-center gap-1 rounded bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700 hover:bg-sky-100"
                      title="View live order tracking"
                    >
                      <span>#{o.id.slice(0, 6)}</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                  {o.customer.phone ? (
                    <p className="mt-0.5 flex items-center gap-1 text-sm text-slate-500">
                      <Phone className="h-3.5 w-3.5" />
                      {o.customer.phone}
                    </p>
                  ) : null}
                </div>
                <StatusBadge status={o.status} />
              </div>

              <p className="mt-3 text-sm text-slate-700">
                {o.items.map((i) => `${i.quantity}× ${i.product.name}`).join(", ")}
                <span className="ml-2 text-slate-400">· {formatINR(o.totalInPaise)}</span>
              </p>

              <div className="mt-3 flex gap-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                <div>
                  <p>
                    {o.address?.line1 ?? "Address"}
                    {o.address?.line2 ? `, ${o.address.line2}` : ""}
                  </p>
                  <p className="text-slate-500">
                    {o.address?.zone?.name ?? "Hyderabad"}, Hyderabad {o.address?.pincode ?? ""}
                  </p>
                  {o.address?.landmark ? (
                    <p className="text-xs text-slate-400">Near {o.address.landmark}</p>
                  ) : null}
                  {o.notes ? (
                    <p className="mt-1 text-xs italic text-amber-700">Note: {o.notes}</p>
                  ) : null}
                </div>
              </div>

              <div className="mt-4">
                <MarkDelivered orderId={o.id} status={o.status} />
              </div>
            </Card>
          ))}
        </div>
      )}

      {done.length > 0 ? (
        <>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Completed ({done.length})
          </h2>
          <div className="space-y-2">
            {done.map((o) => (
              <Card key={o.id} className="!py-3 opacity-80">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-800">{o.customer.name}</p>
                      <Link
                        href={`/orders/${o.id}`}
                        className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600 hover:bg-slate-200"
                        title="View completed order details"
                      >
                        <span>#{o.id.slice(0, 6)}</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                    <p className="text-xs text-slate-500">
                      {o.address?.zone?.name ?? "Hyderabad"} ·{" "}
                      {o.deliveredAt
                        ? new Date(o.deliveredAt).toLocaleString("en-IN", {
                            timeZone: "Asia/Kolkata",
                          })
                        : ""}
                    </p>
                  </div>
                  <StatusBadge status={o.status} />
                </div>
              </Card>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
