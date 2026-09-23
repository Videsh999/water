import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { formatINR } from "@/lib/utils";
import { Button, Card, PageHeader } from "@/components/ui";
import { OrderForm } from "./order-form";
import { FALLBACK_PRODUCTS, FALLBACK_ZONES } from "@/lib/demo-data";

export default async function ProductsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "CUSTOMER") {
    if (user.role === "ADMIN") redirect("/admin");
    if (user.role === "DRIVER") redirect("/driver");
  }

  const [productsData, zonesData, address] = await Promise.all([
    prisma.product
      .findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } })
      .catch(() => []),
    prisma.zone.findMany({ orderBy: { name: "asc" } }).catch(() => []),
    prisma.address
      .findFirst({
        where: { userId: user.id },
        include: { zone: true },
      })
      .catch(() => null),
  ]);

  const products = productsData.length > 0 ? productsData : FALLBACK_PRODUCTS;
  const zones = zonesData.length > 0 ? zonesData : FALLBACK_ZONES;

  return (
    <div>
      <PageHeader
        title="Order water"
        subtitle="20L jars & bottled packs — delivered across Hyderabad."
        action={
          <Link href="/orders">
            <Button variant="secondary">My orders</Button>
          </Link>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {products.map((p) => (
          <Card key={p.id} className="flex flex-col">
            <div className="text-3xl">{p.emoji}</div>
            <h3 className="mt-2 font-semibold text-slate-900">{p.name}</h3>
            <p className="mt-1 flex-1 text-sm text-slate-500">{p.description}</p>
            <p className="mt-3 text-lg font-bold text-sky-700">
              {formatINR(p.priceInPaise)}
              <span className="ml-1 text-xs font-normal text-slate-400">
                / {p.unit}
              </span>
            </p>
          </Card>
        ))}
      </div>

      <OrderForm
        customerId={user.id}
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          priceInPaise: p.priceInPaise,
          emoji: p.emoji,
        }))}
        zones={zones.map((z) => ({ id: z.id, name: z.name }))}
        defaultAddress={
          address
            ? {
                line1: address.line1,
                line2: address.line2 ?? "",
                landmark: address.landmark ?? "",
                pincode: address.pincode,
                zoneName: address.zone.name,
              }
            : null
        }
      />
    </div>
  );
}
