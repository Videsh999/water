"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Droplets, LogOut, Package, Truck, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui";

type NavUser = {
  name: string;
  role: "CUSTOMER" | "DRIVER" | "ADMIN";
} | null;

export function TopNav({ user }: { user: NavUser }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const links =
    user?.role === "ADMIN"
      ? [
          { href: "/admin", label: "Orders", icon: LayoutDashboard },
        ]
      : user?.role === "DRIVER"
        ? [{ href: "/driver", label: "Deliveries", icon: Truck }]
        : [
            { href: "/products", label: "Products", icon: Package },
            { href: "/orders", label: "My Orders", icon: Truck },
          ];

  return (
    <header className="sticky top-0 z-40 border-b border-sky-100/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-sky-700">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-600 text-white shadow-sm shadow-sky-600/30">
            <Droplets className="h-4 w-4" />
          </span>
          <span>
            Water
            <span className="ml-1 hidden text-xs font-medium text-slate-400 sm:inline">
              Hyderabad
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {user
            ? links.map((l) => {
                const Icon = l.icon;
                const active = pathname === l.href || pathname.startsWith(l.href + "/");
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition",
                      active
                        ? "bg-sky-50 text-sky-700"
                        : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{l.label}</span>
                  </Link>
                );
              })
            : null}

          {user ? (
            <div className="ml-2 flex items-center gap-2 border-l border-slate-200 pl-3">
              <span className="hidden text-xs text-slate-500 sm:inline">
                {user.name}
              </span>
              <Button variant="ghost" className="!px-2 !py-1.5" onClick={logout} title="Log out">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Link href="/login">
              <Button variant="secondary" className="!py-1.5">
                Log in
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
