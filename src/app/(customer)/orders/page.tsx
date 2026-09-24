import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { formatINR } from "@/lib/utils";
import { Button, Card, PageHeader } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import { RefreshButton } from "@/components/refresh-button";

export default async function CustomerOrdersPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "CUSTOMER") redirect("/");

  const orders = await prisma.order.findMany({
    where: { customerId: user.id },
    include: {
      address: { include: { zone: true } },
      items: { include: { product: true } },
      driver: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="My orders"
        subtitle="Track status from pending to delivered."
        action={
          <div className="flex items-center gap-2">
            <RefreshButton label="Refresh" />
            <Link href="/products">
              <Button>Order again</Button>
            </Link>
          </div>
        }
      />

      {orders.length === 0 ? (
        <Card>
          <p className="text-slate-500">No orders yet.</p>
          <Link href="/products" className="mt-3 inline-block">
            <Button>Browse products</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <Link key={o.id} href={`/orders/${o.id}`}>
              <Card className="mb-3 transition hover:border-sky-200 hover:shadow-md">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {o.items.map((i) => `${i.quantity}× ${i.product.name}`).join(", ")}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {o.address?.zone?.name ?? "Hyderabad"} · {o.type === "SUBSCRIPTION" ? "Subscription" : "One-time"}
                    </p>
                  </div>
                  <StatusBadge status={o.status} />
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-slate-400">
                    {new Date(o.createdAt).toLocaleString("en-IN", {
                      timeZone: "Asia/Kolkata",
                    })}
                  </span>
                  <span className="font-semibold text-sky-700">
                    {formatINR(o.totalInPaise)}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
