import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { FALLBACK_PRODUCTS } from "@/lib/demo-data";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    });
    if (products && products.length > 0) return NextResponse.json(products);
    return NextResponse.json(FALLBACK_PRODUCTS);
  } catch (err) {
    console.warn("Products lookup failed, returning fallback products:", err);
    return NextResponse.json(FALLBACK_PRODUCTS);
  }
}
