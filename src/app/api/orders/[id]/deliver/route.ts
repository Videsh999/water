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

  const { id } = await params;
  const existing = await prisma.order.findUnique({ where: { id } });
  if (!existing || existing.driverId !== user.id) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const order = await prisma.order.update({
    where: { id },
    data: {
      status: "DELIVERED",
      deliveredAt: new Date(),
    },
    include: {
      customer: true,
      address: { include: { zone: true } },
      items: { include: { product: true } },
    },
  });

  return NextResponse.json(order);
}
