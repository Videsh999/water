import { cookies } from "next/headers";
import { prisma } from "./prisma";
import type { User } from "@prisma/client";

const COOKIE = "water_session";

export const DEMO_FALLBACK_USERS: Record<string, Partial<User>> = {
  "cmuecdg1d0008v5xbx9l3gb3r": {
    id: "cmuecdg1d0008v5xbx9l3gb3r",
    email: "customer@water.hyderabad",
    name: "Priya Sharma",
    phone: "+91 90000 00003",
    role: "CUSTOMER",
    password: "customer123",
  },
  "cmuecdg1b0007v5xbd2iby1lr": {
    id: "cmuecdg1b0007v5xbd2iby1lr",
    email: "driver@water.hyderabad",
    name: "Ravi Kumar",
    phone: "+91 90000 00002",
    role: "DRIVER",
    password: "driver123",
  },
  "cmuecdg190005v5xb8qit7yxv": {
    id: "cmuecdg190005v5xb8qit7yxv",
    email: "admin@water.hyderabad",
    name: "Water Admin",
    phone: "+91 90000 00001",
    role: "ADMIN",
    password: "admin123",
  },
};

export async function getSessionUser(): Promise<User | null> {
  const jar = await cookies();
  const userId = jar.get(COOKIE)?.value;
  if (!userId) return null;
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) return user;
  } catch (err) {
    console.error("getSessionUser prisma lookup error:", err);
  }
  if (DEMO_FALLBACK_USERS[userId]) {
    return DEMO_FALLBACK_USERS[userId] as User;
  }
  return null;
}

export async function requireUser(roles?: string[]): Promise<User> {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHORIZED");
  if (roles && !roles.includes(user.role)) throw new Error("FORBIDDEN");
  return user;
}

export function sessionCookieName() {
  return COOKIE;
}

export async function setSession(userId: string) {
  const jar = await cookies();
  jar.set(COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}
