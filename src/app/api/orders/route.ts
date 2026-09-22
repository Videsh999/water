import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";


export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (user.role === "ADMIN") {
    const orders = await prisma.order.findMany({
      include: {
        customer: true,
        driver: true,
        address: { include: { zone: true } },
        items: { include: { product: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(orders);
  }

  if (user.role === "DRIVER") {
    const orders = await prisma.order.findMany({
      where: { driverId: user.id },
      include: {
        customer: true,
        address: { include: { zone: true } },
        items: { include: { product: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(orders);
  }

  const orders = await prisma.order.findMany({
    where: { customerId: user.id },
    include: {
      driver: true,
      address: { include: { zone: true } },
      items: { include: { product: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(orders);
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const items: { productId: string; quantity: number }[] = body.items || [];
    const type = body.type === "SUBSCRIPTION" ? "SUBSCRIPTION" : "ONE_TIME";
    const notes = body.notes ? String(body.notes) : null;

    if (!items.length) {
      return NextResponse.json({ error: "Add at least one product" }, { status: 400 });
    }

    const productIds = items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, active: true },
    });
    if (products.length !== productIds.length) {
      return NextResponse.json({ error: "Invalid product" }, { status: 400 });
    }

    const productMap = Object.fromEntries(products.map((p) => [p.id, p]));
    let totalInPaise = 0;
    const orderItems = items.map((i) => {
      const p = productMap[i.productId];
      const qty = Math.max(1, Number(i.quantity) || 1);
      totalInPaise += p.priceInPaise * qty;
      return {
        productId: p.id,
        quantity: qty,
        priceInPaise: p.priceInPaise,
      };
    });

    let address = await prisma.address.findFirst({ where: { userId: user.id } });

    if (!address && body.address) {
      const zone = await prisma.zone.findFirst({
        where: { name: String(body.address.zoneName || "Gachibowli") },
      });
      if (!zone) {
        return NextResponse.json({ error: "Invalid zone" }, { status: 400 });
      }
      address = await prisma.address.create({
        data: {
          userId: user.id,
          label: body.address.label || "Home",
          line1: String(body.address.line1 || ""),
          line2: body.address.line2 ? String(body.address.line2) : null,
          landmark: body.address.landmark ? String(body.address.landmark) : null,
          zoneId: zone.id,
          pincode: String(body.address.pincode || "500032"),
          city: "Hyderabad",
        },
      });
    }

    if (!address) {
      return NextResponse.json({ error: "Address required" }, { status: 400 });
    }

    const order = await prisma.order.create({
      data: {
        customerId: user.id,
        addressId: address.id,
        status: "PENDING",
        type,
        paymentStatus: "STUB_PAID",
        notes,
        totalInPaise,
        items: { create: orderItems },
      },
      include: {
        items: { include: { product: true } },
        address: { include: { zone: true } },
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Could not create order" }, { status: 500 });
  }
}
