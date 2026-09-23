import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const driverId = String(body.driverId || "");

    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (existing.status === "DELIVERED" || existing.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Cannot assign a driver to a completed or cancelled order" },
        { status: 400 }
      );
    }

    const driver = await prisma.user.findFirst({
      where: { id: driverId, role: "DRIVER" },
    });
    if (!driver) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    const order = await prisma.order.update({
      where: { id },
      data: {
        driverId: driver.id,
        status: "ASSIGNED",
      },
      include: {
        customer: true,
        driver: true,
        address: { include: { zone: true } },
        items: { include: { product: true } },
      },
    });

    return NextResponse.json(order);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Assign failed" }, { status: 500 });
  }
}
