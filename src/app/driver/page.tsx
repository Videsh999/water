import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { formatINR } from "@/lib/utils";
import { Card, PageHeader } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import { MarkDelivered } from "./mark-delivered";
import { MapPin, Phone } from "lucide-react";

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
                  <p className="font-semibold text-slate-900">{o.customer.name}</p>
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
                    {o.address.line1}
                    {o.address.line2 ? `, ${o.address.line2}` : ""}
                  </p>
                  <p className="text-slate-500">
                    {o.address.zone.name}, Hyderabad {o.address.pincode}
                  </p>
                  {o.address.landmark ? (
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
                    <p className="font-medium text-slate-800">{o.customer.name}</p>
                    <p className="text-xs text-slate-500">
                      {o.address.zone.name} ·{" "}
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
