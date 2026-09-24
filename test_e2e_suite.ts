import assert from "node:assert";

const BASE_URL = "http://localhost:3000";

async function runTests() {
  console.log("=== STARTING COMPREHENSIVE END-TO-END SUITE ===\n");
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

  // 1. Catalog & Zones
  await test("GET /api/products returns active products list", async () => {
    const res = await fetch(`${BASE_URL}/api/products`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert(Array.isArray(data), "Expected array of products");
    assert(data.length >= 3, `Expected at least 3 products, got ${data.length}`);
    const jar = data.find((p: { name: string; priceInPaise: number }) => p.name.includes("20L"));
    assert(jar, "Expected 20L Jar in catalog");
    assert.strictEqual(jar.priceInPaise, 4000);
  });

  await test("GET /api/zones returns Hyderabad coverage zones", async () => {
    const res = await fetch(`${BASE_URL}/api/zones`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert(Array.isArray(data), "Expected array of zones");
    assert(data.length >= 5, `Expected at least 5 zones, got ${data.length}`);
    const names = data.map((z: { name: string }) => z.name);
    assert(names.includes("Gachibowli"), "Zone Gachibowli missing");
    assert(names.includes("Madhapur"), "Zone Madhapur missing");
    assert(names.includes("Hitech City"), "Zone Hitech City missing");
  });

  // 2. Auth: Bad login
  await test("POST /api/auth/login rejects wrong password", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "customer@water.hyderabad",
        password: "wrongpassword",
      }),
    });
    assert.strictEqual(res.status, 401);
  });

  // 3. Customer login & session
  let customerCookie = "";
  let customerUser: { id: string; role: string } = { id: "", role: "" };

  await test("POST /api/auth/login succeeds for Customer", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "customer@water.hyderabad",
        password: "customer123",
      }),
    });
    assert.strictEqual(res.status, 200);
    customerUser = await res.json();
    assert.strictEqual(customerUser.role, "CUSTOMER");
    const setCookie = res.headers.get("set-cookie") || "";
    assert(setCookie.includes("water_session="), "Expected water_session cookie");
    customerCookie = setCookie.split(";")[0];
  });

  await test("GET /api/auth/me returns Customer session info", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: customerCookie },
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert(data.user, "Expected session user");
    assert.strictEqual(data.user.role, "CUSTOMER");
    assert.strictEqual(data.user.email, "customer@water.hyderabad");
  });

  // 4. Customer order placement validation
  await test("POST /api/orders validates empty items", async () => {
    const res = await fetch(`${BASE_URL}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: customerCookie,
      },
      body: JSON.stringify({
        items: [],
        address: { line1: "Test Flat" },
      }),
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert(data.error.includes("at least one product"));
  });

  await test("POST /api/orders validates missing address", async () => {
    const res = await fetch(`${BASE_URL}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: customerCookie,
      },
      body: JSON.stringify({
        items: [{ productId: "prod-20l-jar", quantity: 1 }],
        address: { line1: "" },
      }),
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert(data.error.includes("Address required"));
  });

  let createdOrderId = "";
  await test("POST /api/orders successfully creates order with correct totals", async () => {
    const prodRes = await fetch(`${BASE_URL}/api/products`);
    const prods = await prodRes.json();
    const jar = prods[0];
    const pack = prods[1];

    const expectedTotal = jar.priceInPaise * 2 + pack.priceInPaise * 1;

    const res = await fetch(`${BASE_URL}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: customerCookie,
      },
      body: JSON.stringify({
        customerId: customerUser.id,
        type: "SUBSCRIPTION",
        notes: "Leave with security if not answering",
        items: [
          { productId: jar.id, quantity: 2 },
          { productId: pack.id, quantity: 1 },
        ],
        address: {
          line1: "Flat 101, Block B, MyHome Bhooja",
          line2: "Knowledge City, Silpa Gram Craft Village",
          landmark: "Near Inorbit Mall",
          zoneName: "Hitech City",
          pincode: "500081",
        },
      }),
    });

    assert.strictEqual(res.status, 201);
    const order = await res.json();
    assert(order.id, "Expected created order id");
    assert.strictEqual(order.status, "PENDING");
    assert.strictEqual(order.type, "SUBSCRIPTION");
    assert.strictEqual(order.totalInPaise, expectedTotal);
    assert.strictEqual(order.items.length, 2);
    createdOrderId = order.id;
  });

  // 5. Customer orders list
  await test("GET /api/orders returns customer's placed orders", async () => {
    const res = await fetch(`${BASE_URL}/api/orders`, {
      headers: { Cookie: customerCookie },
    });
    assert.strictEqual(res.status, 200);
    const orders = await res.json();
    assert(Array.isArray(orders), "Expected array of orders");
    const found = orders.find((o: { id: string }) => o.id === createdOrderId);
    assert(found, "Newly created order must appear in customer's order list");
  });

  // 6. Admin Login & Order Management
  let adminCookie = "";
  let adminUser: { id: string; role: string } = { id: "", role: "" };

  await test("POST /api/auth/login succeeds for Admin", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@water.hyderabad",
        password: "admin123",
      }),
    });
    assert.strictEqual(res.status, 200);
    adminUser = await res.json();
    assert.strictEqual(adminUser.role, "ADMIN");
    const setCookie = res.headers.get("set-cookie") || "";
    adminCookie = setCookie.split(";")[0];
  });

  let driversList: { id: string; name: string }[] = [];
  await test("GET /api/drivers returns active drivers for Admin", async () => {
    const res = await fetch(`${BASE_URL}/api/drivers`, {
      headers: { Cookie: adminCookie },
    });
    assert.strictEqual(res.status, 200);
    driversList = await res.json();
    assert(Array.isArray(driversList), "Expected drivers array");
    assert(driversList.length >= 1, "Expected at least 1 driver");
    assert.strictEqual(driversList[0].name, "Ravi Kumar");
  });

  await test("GET /api/orders for Admin returns all customer orders", async () => {
    const res = await fetch(`${BASE_URL}/api/orders`, {
      headers: { Cookie: adminCookie },
    });
    assert.strictEqual(res.status, 200);
    const allOrders = await res.json();
    assert(allOrders.length >= 2, "Expected multiple orders across all users");
    const found = allOrders.find((o: { id: string }) => o.id === createdOrderId);
    assert(found, "Admin must see customer's newly created order");
  });

  await test("POST /api/orders/[id]/assign assigns driver to order", async () => {
    const driverId = driversList[0].id;
    const res = await fetch(`${BASE_URL}/api/orders/${createdOrderId}/assign`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({ driverId }),
    });
    assert.strictEqual(res.status, 200);
    const updated = await res.json();
    assert.strictEqual(updated.status, "ASSIGNED");
    assert.strictEqual(updated.driverId, driverId);
  });

  // 7. Driver Login & Delivery Lifecycle
  let driverCookie = "";
  let driverUser: { id: string; role: string } = { id: "", role: "" };

  await test("POST /api/auth/login succeeds for Driver", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "driver@water.hyderabad",
        password: "driver123",
      }),
    });
    assert.strictEqual(res.status, 200);
    driverUser = await res.json();
    assert.strictEqual(driverUser.role, "DRIVER");
    const setCookie = res.headers.get("set-cookie") || "";
    driverCookie = setCookie.split(";")[0];
  });

  await test("GET /api/orders for Driver returns assigned orders", async () => {
    const res = await fetch(`${BASE_URL}/api/orders`, {
      headers: { Cookie: driverCookie },
    });
    assert.strictEqual(res.status, 200);
    const orders = await res.json();
    const assignedOrder = orders.find((o: { id: string; status: string }) => o.id === createdOrderId);
    assert(assignedOrder, "Driver must see newly assigned order");
    assert.strictEqual(assignedOrder.status, "ASSIGNED");
  });

  await test("POST /api/orders/[id]/deliver transitions ASSIGNED -> OUT_FOR_DELIVERY", async () => {
    const res = await fetch(`${BASE_URL}/api/orders/${createdOrderId}/deliver`, {
      method: "POST",
      headers: { Cookie: driverCookie },
    });
    assert.strictEqual(res.status, 200);
    const updated = await res.json();
    assert.strictEqual(updated.status, "OUT_FOR_DELIVERY");
  });

  await test("POST /api/orders/[id]/deliver transitions OUT_FOR_DELIVERY -> DELIVERED", async () => {
    const res = await fetch(`${BASE_URL}/api/orders/${createdOrderId}/deliver`, {
      method: "POST",
      headers: { Cookie: driverCookie },
    });
    assert.strictEqual(res.status, 200);
    const updated = await res.json();
    assert.strictEqual(updated.status, "DELIVERED");
    assert(updated.deliveredAt, "deliveredAt timestamp must be set");
  });

  await test("POST /api/orders/[id]/deliver prevents delivery update once DELIVERED", async () => {
    const res = await fetch(`${BASE_URL}/api/orders/${createdOrderId}/deliver`, {
      method: "POST",
      headers: { Cookie: driverCookie },
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.error, "Already delivered");
  });

  // 8. Order Detail API & Security
  await test("GET /api/orders/[id] allows Customer to view their order", async () => {
    const res = await fetch(`${BASE_URL}/api/orders/${createdOrderId}`, {
      headers: { Cookie: customerCookie },
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.id, createdOrderId);
    assert.strictEqual(data.status, "DELIVERED");
    assert(data.items && data.items.length > 0);
  });

  await test("GET /api/orders/[id] allows Admin to inspect any order", async () => {
    const res = await fetch(`${BASE_URL}/api/orders/${createdOrderId}`, {
      headers: { Cookie: adminCookie },
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.id, createdOrderId);
  });

  await test("GET /api/orders/[id] rejects unauthenticated request", async () => {
    const res = await fetch(`${BASE_URL}/api/orders/${createdOrderId}`);
    assert.strictEqual(res.status, 401);
  });

  // 9. Order Cancellation Flow
  let cancelTestOrderId = "";
  await test("Customer places an order to test cancellation flow", async () => {
    const prodRes = await fetch(`${BASE_URL}/api/products`);
    const prods = await prodRes.json();
    const res = await fetch(`${BASE_URL}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: customerCookie,
      },
      body: JSON.stringify({
        customerId: customerUser.id,
        items: [{ productId: prods[0].id, quantity: 1 }],
        address: { line1: "Temp cancellation test address" },
      }),
    });
    assert.strictEqual(res.status, 201);
    const order = await res.json();
    cancelTestOrderId = order.id;
    assert.strictEqual(order.status, "PENDING");
  });

  await test("PATCH /api/orders/[id] cancels pending order successfully", async () => {
    const res = await fetch(`${BASE_URL}/api/orders/${cancelTestOrderId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: customerCookie,
      },
      body: JSON.stringify({ action: "CANCEL" }),
    });
    assert.strictEqual(res.status, 200);
    const updated = await res.json();
    assert.strictEqual(updated.status, "CANCELLED");
  });

  await test("PATCH /api/orders/[id] prevents double cancellation", async () => {
    const res = await fetch(`${BASE_URL}/api/orders/${cancelTestOrderId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: customerCookie,
      },
      body: JSON.stringify({ action: "CANCEL" }),
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.error, "Order is already cancelled");
  });

  await test("POST /api/orders/[id]/assign rejects assigning cancelled order", async () => {
    const res = await fetch(`${BASE_URL}/api/orders/${cancelTestOrderId}/assign`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({ driverId: driversList[0].id }),
    });
    assert.strictEqual(res.status, 400);
  });
  await test("POST /api/auth/logout clears session", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: "POST",
      headers: { Cookie: driverCookie },
    });
    assert.strictEqual(res.status, 200);
    const setCookie = res.headers.get("set-cookie") || "";
    assert(
      setCookie.toLowerCase().includes("max-age=0") ||
        setCookie.toLowerCase().includes("expires="),
      "Cookie must be cleared"
    );
  });

  console.log(`\n=== RESULTS: ${passed} PASSED, ${failed} FAILED ===\n`);
  if (failed > 0) process.exit(1);
}

runTests().catch((e) => {
  console.error("FATAL SUITE ERROR:", e);
  process.exit(1);
});
