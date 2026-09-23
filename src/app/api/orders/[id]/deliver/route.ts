import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user || user.role !== "DRIVER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing || existing.driverId !== user.id) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (existing.status === "DELIVERED") {
      return NextResponse.json({ error: "Already delivered" }, { status: 400 });
    }
    if (existing.status === "CANCELLED") {
      return NextResponse.json({ error: "Order was cancelled" }, { status: 400 });
    }
    if (existing.status !== "ASSIGNED" && existing.status !== "OUT_FOR_DELIVERY") {
      return NextResponse.json(
        { error: "Order is not ready for delivery updates" },
        { status: 400 }
      );
    }

    // Advance: ASSIGNED → OUT_FOR_DELIVERY → DELIVERED
    const nextStatus =
      existing.status === "ASSIGNED" ? "OUT_FOR_DELIVERY" : "DELIVERED";

    const order = await prisma.order.update({
      where: { id },
      data: {
        status: nextStatus,
        deliveredAt: nextStatus === "DELIVERED" ? new Date() : null,
      },
      include: {
        customer: true,
        address: { include: { zone: true } },
        items: { include: { product: true } },
      },
    });

    return NextResponse.json(order);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
