"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Label } from "@/components/ui";

const DEMO = [
  { role: "Customer", email: "customer@water.hyderabad", password: "customer123" },
  { role: "Driver", email: "driver@water.hyderabad", password: "driver123" },
  { role: "Admin", email: "admin@water.hyderabad", password: "admin123" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("customer@water.hyderabad");
  const [password, setPassword] = useState("customer123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  async function login(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }
      if (data.role === "ADMIN") router.push("/admin");
      else if (data.role === "DRIVER") router.push("/driver");
      else router.push("/products");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900">Sign in to Water</h1>
        <p className="mt-1 text-sm text-slate-500">
          Demo accounts for customer, driver, and admin roles.
        </p>
      </div>

      <Card>
        <form onSubmit={login} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          {error ? (
            <p className="text-sm text-rose-600">{error}</p>
          ) : null}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </Card>

      <Card className="!p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Quick fill
        </p>
        <div className="space-y-2">
          {DEMO.map((d) => (
            <button
              key={d.email}
              type="button"
              onClick={() => {
                setEmail(d.email);
                setPassword(d.password);
              }}
              className="flex w-full items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-left text-sm hover:bg-sky-50"
            >
              <span className="font-medium text-slate-800">{d.role}</span>
              <span className="text-xs text-slate-500">{d.email}</span>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
