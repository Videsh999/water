import Link from "next/link";
import { Droplets, Truck, ShieldCheck, MapPin } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const user = await getSessionUser();
  if (user?.role === "ADMIN") redirect("/admin");
  if (user?.role === "DRIVER") redirect("/driver");
  if (user?.role === "CUSTOMER") redirect("/products");

  return (
    <div className="space-y-10">
      <section className="overflow-hidden rounded-3xl border border-sky-100 bg-gradient-to-br from-sky-600 via-sky-500 to-cyan-500 p-8 text-white shadow-lg shadow-sky-500/20 sm:p-12">
        <div className="flex items-center gap-2 text-sky-100">
          <Droplets className="h-5 w-5" />
          <span className="text-sm font-medium">Launching in Hyderabad</span>
        </div>
        <h1 className="mt-3 max-w-xl text-3xl font-bold tracking-tight sm:text-5xl">
          Fresh water, on time — at your door.
        </h1>
        <p className="mt-4 max-w-lg text-sky-50/90">
          Order 20L jars or bottled packs. Track every delivery. Built for
          Gachibowli, Madhapur, Hitech City, Banjara Hills & Jubilee Hills.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/login">
            <Button className="!bg-white !text-sky-700 hover:!bg-sky-50">
              Get started
            </Button>
          </Link>
          <Link href="/login">
            <Button
              variant="ghost"
              className="!border !border-white/30 !text-white hover:!bg-white/10"
            >
              Demo logins
            </Button>
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          {
            icon: MapPin,
            title: "Hyderabad first",
            body: "Day-one coverage across key tech & residential zones.",
          },
          {
            icon: Truck,
            title: "Track deliveries",
            body: "From order placed → driver assigned → delivered.",
          },
          {
            icon: ShieldCheck,
            title: "Simple & local",
            body: "Subscriptions or one-time orders. Payments stubbed for now.",
          },
        ].map((f) => (
          <Card key={f.title}>
            <f.icon className="h-5 w-5 text-sky-600" />
            <h3 className="mt-3 font-semibold text-slate-900">{f.title}</h3>
            <p className="mt-1 text-sm text-slate-500">{f.body}</p>
          </Card>
        ))}
      </section>
    </div>
  );
}
