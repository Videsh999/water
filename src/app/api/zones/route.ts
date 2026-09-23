import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { FALLBACK_ZONES } from "@/lib/demo-data";

export async function GET() {
  try {
    const zones = await prisma.zone.findMany({ orderBy: { name: "asc" } });
    if (zones && zones.length > 0) return NextResponse.json(zones);
    return NextResponse.json(FALLBACK_ZONES);
  } catch (err) {
    console.warn("Zones lookup failed, returning fallback zones:", err);
    return NextResponse.json(FALLBACK_ZONES);
  }
}
