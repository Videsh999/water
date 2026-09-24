import assert from "node:assert";

const BASE_URL = "http://localhost:3000";

async function runPageTests() {
  console.log("=== STARTING FULL SSR PAGES & ROUTING TEST SUITE ===\n");
  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      process.stdout.write(`Testing: ${name}... `);
      await fn();
      console.log("✅ PASS");
      passed++;
    } catch (err: unknown) {
      console.log("❌ FAIL");
      console.error("  Error:", err instanceof Error ? err.message : String(err));
      failed++;
    }
  }

  // Helpers to get cookies
  async function login(email: string, password: string) {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const setCookie = res.headers.get("set-cookie") || "";
    return setCookie.split(";")[0];
  }

  const customerCookie = await login("customer@water.hyderabad", "customer123");
  const adminCookie = await login("admin@water.hyderabad", "admin123");
  const driverCookie = await login("driver@water.hyderabad", "driver123");

  // 1. Public Landing Page
  await test("GET / (Public) renders landing page with Hyderabad coverage", async () => {
    const res = await fetch(`${BASE_URL}/`, { redirect: "manual" });
    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert(html.includes("Fresh water, on time"), "Hero headline missing");
    assert(html.includes("Hyderabad"), "City name missing");
    assert(html.includes("Get started"), "Get started CTA missing");
    assert(html.includes("Demo logins"), "Demo logins CTA missing");
  });

  // 2. Login Page
  await test("GET /login renders login form & demo accounts cards", async () => {
    const res = await fetch(`${BASE_URL}/login`);
    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert(html.includes("Sign in to Water"), "Sign in title missing");
    assert(html.includes("Customer"), "Customer role missing");
    assert(html.includes("Driver"), "Driver role missing");
    assert(html.includes("Admin"), "Admin role missing");
  });

  // 3. Unauthenticated route protections
  await test("GET /products without session redirects to /login", async () => {
    const res = await fetch(`${BASE_URL}/products`, { redirect: "manual" });
    assert(res.status === 307 || res.status === 302, `Expected redirect, got ${res.status}`);
    assert(res.headers.get("location")?.includes("/login"));
  });

  await test("GET /admin without session redirects to /login", async () => {
    const res = await fetch(`${BASE_URL}/admin`, { redirect: "manual" });
    assert(res.status === 307 || res.status === 302, `Expected redirect, got ${res.status}`);
    assert(res.headers.get("location")?.includes("/login"));
  });

  await test("GET /driver without session redirects to /login", async () => {
    const res = await fetch(`${BASE_URL}/driver`, { redirect: "manual" });
    assert(res.status === 307 || res.status === 302, `Expected redirect, got ${res.status}`);
    assert(res.headers.get("location")?.includes("/login"));
  });

  await test("GET /orders without session redirects to /login", async () => {
    const res = await fetch(`${BASE_URL}/orders`, { redirect: "manual" });
    assert(res.status === 307 || res.status === 302, `Expected redirect, got ${res.status}`);
    assert(res.headers.get("location")?.includes("/login"));
  });

  // 4. Role-based landing redirects
  await test("GET / with Customer session redirects to /products", async () => {
    const res = await fetch(`${BASE_URL}/`, {
      headers: { Cookie: customerCookie },
      redirect: "manual",
    });
    assert(res.status === 307 || res.status === 302, `Expected redirect, got ${res.status}`);
    assert(res.headers.get("location")?.includes("/products"));
  });

  await test("GET / with Admin session redirects to /admin", async () => {
    const res = await fetch(`${BASE_URL}/`, {
      headers: { Cookie: adminCookie },
      redirect: "manual",
    });
    assert(res.status === 307 || res.status === 302, `Expected redirect, got ${res.status}`);
    assert(res.headers.get("location")?.includes("/admin"));
  });

  await test("GET / with Driver session redirects to /driver", async () => {
    const res = await fetch(`${BASE_URL}/`, {
      headers: { Cookie: driverCookie },
      redirect: "manual",
    });
    assert(res.status === 307 || res.status === 302, `Expected redirect, got ${res.status}`);
    assert(res.headers.get("location")?.includes("/driver"));
  });

  // 5. Customer pages rendering
  await test("GET /products with Customer session renders catalog & order form", async () => {
    const res = await fetch(`${BASE_URL}/products`, {
      headers: { Cookie: customerCookie },
    });
    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert(html.includes("Order water"), "Order water header missing");
    assert(html.includes("20L Jar"), "20L Jar product missing");
    assert(html.includes("Place an order"), "Place an order form missing");
  });

  await test("GET /orders with Customer session renders order history", async () => {
    const res = await fetch(`${BASE_URL}/orders`, {
      headers: { Cookie: customerCookie },
    });
    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert(html.includes("My orders"), "My orders header missing");
  });

  // 6. Admin page rendering
  await test("GET /admin with Admin session renders KPIs and orders table", async () => {
    const res = await fetch(`${BASE_URL}/admin`, {
      headers: { Cookie: adminCookie },
    });
    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert(html.includes("Admin"), "Admin header missing");
    assert(html.includes("Pending assignment"), "Pending KPI missing");
    assert(html.includes("Active drivers"), "Active drivers KPI missing");
    assert(html.includes("Catalog SKUs"), "Catalog SKUs KPI missing");
    assert(html.includes("Inventory-lite"), "Inventory table missing");
  });

  // 7. Driver page rendering
  await test("GET /driver with Driver session renders delivery run dashboard", async () => {
    const res = await fetch(`${BASE_URL}/driver`, {
      headers: { Cookie: driverCookie },
    });
    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert(html.includes("My deliveries"), "My deliveries header missing");
    assert(html.includes("Active"), "Active deliveries section missing");
  });

  // 8. Cross-role boundary protection
  await test("GET /admin with Customer session is forbidden and redirects", async () => {
    const res = await fetch(`${BASE_URL}/admin`, {
      headers: { Cookie: customerCookie },
      redirect: "manual",
    });
    assert(res.status === 307 || res.status === 302, `Expected redirect, got ${res.status}`);
    assert(res.headers.get("location") === "/");
  });

  await test("GET /driver with Customer session is forbidden and redirects", async () => {
    const res = await fetch(`${BASE_URL}/driver`, {
      headers: { Cookie: customerCookie },
      redirect: "manual",
    });
    assert(res.status === 307 || res.status === 302, `Expected redirect, got ${res.status}`);
    assert(res.headers.get("location") === "/");
  });

  console.log(`\n=== ALL ${passed} PAGE & ROUTING TESTS PASSED (${failed} FAILED) ===\n`);
  if (failed > 0) process.exit(1);
}

runPageTests().catch((e) => {
  console.error("FATAL PAGE TEST ERROR:", e);
  process.exit(1);
});
