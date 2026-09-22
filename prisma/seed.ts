import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.address.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
  await prisma.zone.deleteMany();

  const zones = await Promise.all(
    [
      "Gachibowli",
      "Madhapur",
      "Hitech City",
      "Banjara Hills",
      "Jubilee Hills",
    ].map((name) =>
      prisma.zone.create({
        data: { name, city: "Hyderabad" },
      })
    )
  );

  const zoneByName = Object.fromEntries(zones.map((z) => [z.name, z]));

  const admin = await prisma.user.create({
    data: {
      email: "admin@water.hyderabad",
      name: "Water Admin",
      phone: "+91 90000 00001",
      role: "ADMIN",
      password: "admin123",
    },
  });

  const driver = await prisma.user.create({
    data: {
      email: "driver@water.hyderabad",
      name: "Ravi Kumar",
      phone: "+91 90000 00002",
      role: "DRIVER",
      password: "driver123",
      zoneId: zoneByName["Gachibowli"].id,
    },
  });

  const customer = await prisma.user.create({
    data: {
      email: "customer@water.hyderabad",
      name: "Priya Sharma",
      phone: "+91 90000 00003",
      role: "CUSTOMER",
      password: "customer123",
    },
  });

  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: "20L Jar",
        description: "Purified 20-litre mineral water jar — refill & exchange friendly.",
        priceInPaise: 4000,
        unit: "jar",
        emoji: "🫙",
        sortOrder: 1,
      },
    }),
    prisma.product.create({
      data: {
        name: "1L Bottled Pack (12)",
        description: "Pack of 12 × 1L purified drinking water bottles.",
        priceInPaise: 18000,
        unit: "pack",
        emoji: "📦",
        sortOrder: 2,
      },
    }),
    prisma.product.create({
      data: {
        name: "500ml Bottled Pack (24)",
        description: "Pack of 24 × 500ml bottles — ideal for offices & events.",
        priceInPaise: 22000,
        unit: "pack",
        emoji: "💧",
        sortOrder: 3,
      },
    }),
  ]);

  const address = await prisma.address.create({
    data: {
      userId: customer.id,
      label: "Home",
      line1: "Flat 402, Lakeview Residency",
      line2: "Near DLF Cyber City",
      landmark: "Opposite Cafe Coffee Day",
      zoneId: zoneByName["Gachibowli"].id,
      pincode: "500032",
      city: "Hyderabad",
    },
  });

  await prisma.order.create({
    data: {
      customerId: customer.id,
      addressId: address.id,
      status: "PENDING",
      type: "ONE_TIME",
      paymentStatus: "STUB_PAID",
      totalInPaise: 8000,
      notes: "Please leave at the security desk if no one answers.",
      items: {
        create: [
          {
            productId: products[0].id,
            quantity: 2,
            priceInPaise: 4000,
          },
        ],
      },
    },
  });

  console.log("Seeded Water (Hyderabad)");
  console.log("Zones:", zones.map((z) => z.name).join(", "));
  console.log("Demo logins:");
  console.log("  Admin:    admin@water.hyderabad / admin123");
  console.log("  Driver:   driver@water.hyderabad / driver123");
  console.log("  Customer: customer@water.hyderabad / customer123");
  console.log("Users:", { admin: admin.email, driver: driver.email, customer: customer.email });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
