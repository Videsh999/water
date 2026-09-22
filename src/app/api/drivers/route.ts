import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const drivers = await prisma.user.findMany({
    where: { role: "DRIVER" },
    include: { zone: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(
    drivers.map((d) => ({
      id: d.id,
      name: d.name,
      email: d.email,
      phone: d.phone,
      zone: d.zone?.name ?? null,
    }))
  );
}
