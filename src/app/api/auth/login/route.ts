import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSession } from "@/lib/auth";
import { DEMO_ACCOUNTS } from "@/lib/demo-data";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    let user = null;
    try {
      user = await prisma.user.findUnique({ where: { email } });
    } catch (dbErr) {
      console.warn("Prisma user query error (using demo fallback if matched):", dbErr);
    }

    if (user) {
      if (user.password !== password) {
        return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
      }

      await setSession(user.id);

      return NextResponse.json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });
    }

    // Check demo accounts fallback
    const demo = DEMO_ACCOUNTS.find(
      (d) => d.email.toLowerCase() === email && d.password === password
    );

    if (demo) {
      await setSession(demo.id);
      return NextResponse.json({
        id: demo.id,
        email: demo.email,
        name: demo.name,
        role: demo.role,
      });
    }

    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  } catch (err) {
    console.error("Login route exception:", err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
