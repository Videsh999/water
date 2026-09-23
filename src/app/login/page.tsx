"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Label } from "@/components/ui";
import {
  Eye,
  EyeOff,
  User,
  Truck,
  ShieldCheck,
  KeyRound,
  ArrowRight,
  Check,
} from "lucide-react";

interface DemoAccount {
  role: string;
  badge: string;
  badgeColor: string;
  icon: typeof User;
  email: string;
  password: string;
  description: string;
}

const DEMO: DemoAccount[] = [
  {
    role: "Customer",
    badge: "Order Water",
    badgeColor: "bg-sky-100 text-sky-800 border-sky-200",
    icon: User,
    email: "customer@water.hyderabad",
    password: "customer123",
    description: "Browse water catalog & track delivery status",
  },
  {
    role: "Driver",
    badge: "Deliveries",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    icon: Truck,
    email: "driver@water.hyderabad",
    password: "driver123",
    description: "View delivery run, navigate & mark delivered",
  },
  {
    role: "Admin",
    badge: "Full Control",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
    icon: ShieldCheck,
    email: "admin@water.hyderabad",
    password: "admin123",
    description: "Assign drivers, manage orders & inventory",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("customer@water.hyderabad");
  const [password, setPassword] = useState("customer123");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeRole, setActiveRole] = useState("Customer");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled || !data.user) return;
        const role = data.user.role;
        if (role === "ADMIN") router.replace("/admin");
        else if (role === "DRIVER") router.replace("/driver");
        else router.replace("/products");
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function executeLogin(targetEmail: string, targetPassword: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, password: targetPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed. Please verify demo credentials below.");
        return;
      }
      if (data.role === "ADMIN") router.push("/admin");
      else if (data.role === "DRIVER") router.push("/driver");
      else router.push("/products");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleFormSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    executeLogin(email, password);
  }

  function handleSelectDemo(d: DemoAccount, autoSubmit = false) {
    setEmail(d.email);
    setPassword(d.password);
    setActiveRole(d.role);
    setError("");
    if (autoSubmit) {
      executeLogin(d.email, d.password);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 pb-12">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          Sign in to Water
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Hyderabad local water delivery platform.
        </p>
      </div>

      {/* Main Login Form Card */}
      <Card>
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setActiveRole("");
              }}
              autoComplete="username"
              placeholder="e.g. customer@water.hyderabad"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="mb-1.5 flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800"
              >
                {showPassword ? (
                  <>
                    <EyeOff className="h-3.5 w-3.5" /> Hide
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5" /> Show
                  </>
                )}
              </button>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setActiveRole("");
                }}
                autoComplete="current-password"
                placeholder="Enter password"
                required
              />
            </div>
          </div>

          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-700">
              {error}
            </div>
          ) : null}

          <Button type="submit" className="w-full text-base font-semibold" disabled={loading}>
            {loading ? "Signing in…" : `Sign in as ${activeRole || "User"}`}
          </Button>
        </form>
      </Card>

      {/* Demo Credentials Card */}
      <Card className="!p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-800">
              Demo Accounts & Passwords
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Click any card to auto-fill both Email & Password, or sign in directly.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {DEMO.map((d) => {
            const Icon = d.icon;
            const isSelected = activeRole === d.role && email === d.email;

            return (
              <div
                key={d.email}
                className={`relative rounded-xl border p-4 transition ${
                  isSelected
                    ? "border-sky-500 bg-sky-50/50 shadow-sm ring-1 ring-sky-400"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70"
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="font-bold text-slate-900">{d.role}</span>
                      <span
                        className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${d.badgeColor}`}
                      >
                        {d.badge}
                      </span>
                    </div>

                    <div className="grid gap-1 pl-9 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-14 text-slate-400">Email:</span>
                        <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono font-medium text-slate-800">
                          {d.email}
                        </code>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-14 text-slate-400">Password:</span>
                        <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 font-mono font-bold text-amber-800 border border-amber-200/60">
                          <KeyRound className="h-3 w-3 text-amber-600" />
                          {d.password}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pl-9 sm:pl-0">
                    <button
                      type="button"
                      onClick={() => handleSelectDemo(d, false)}
                      className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                        isSelected
                          ? "bg-sky-600 text-white shadow-sm"
                          : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {isSelected ? (
                        <span className="inline-flex items-center gap-1">
                          <Check className="h-3.5 w-3.5" /> Selected
                        </span>
                      ) : (
                        "Fill Form"
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleSelectDemo(d, true)}
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50"
                    >
                      Instant Sign In
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
