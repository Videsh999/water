import { cookies } from "next/headers";
import { prisma } from "./prisma";
import type { User } from "@prisma/client";

const COOKIE = "water_session";

const DEMO_CUSTOMER: User = {
  id: "cmuecdg1d0008v5xbx9l3gb3r",
  email: "customer@water.hyderabad",
  name: "Priya Sharma",
  phone: "+91 90000 00003",
  role: "CUSTOMER",
  password: "customer123",
  zoneId: "zone-gachibowli",
  createdAt: new Date(),
};

const DEMO_DRIVER: User = {
  id: "cmuecdg1b0007v5xbd2iby1lr",
  email: "driver@water.hyderabad",
  name: "Ravi Kumar",
  phone: "+91 90000 00002",
  role: "DRIVER",
  password: "driver123",
  zoneId: "zone-gachibowli",
  createdAt: new Date(),
};

const DEMO_ADMIN: User = {
  id: "cmuecdg190005v5xb8qit7yxv",
  email: "admin@water.hyderabad",
  name: "Water Admin",
  phone: "+91 90000 00001",
  role: "ADMIN",
  password: "admin123",
  zoneId: null,
  createdAt: new Date(),
};

export const DEMO_FALLBACK_USERS: Record<string, User> = {
  // IDs
  "cmuecdg1d0008v5xbx9l3gb3r": DEMO_CUSTOMER,
  "cmuecdg1b0007v5xbd2iby1lr": DEMO_DRIVER,
  "cmuecdg190005v5xb8qit7yxv": DEMO_ADMIN,
  // Emails
  "customer@water.hyderabad": DEMO_CUSTOMER,
  "driver@water.hyderabad": DEMO_DRIVER,
  "admin@water.hyderabad": DEMO_ADMIN,
  // Roles / keywords
  customer: DEMO_CUSTOMER,
  driver: DEMO_DRIVER,
  admin: DEMO_ADMIN,
};

export async function getSessionUser(req?: Request): Promise<User | null> {
  let userId: string | undefined;

  // 1. Try reading from Next.js cookies()
  try {
    const jar = await cookies();
    userId = jar.get(COOKIE)?.value;
  } catch {}

  // 2. If not found and request object is passed, check headers directly
  if (!userId && req) {
    try {
      const cookieHeader = req.headers.get("cookie") || "";
      const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
      if (match) {
        userId = match[1];
      }
    } catch {}
  }

  if (!userId) return null;

  // Clean quotes or URI encoding
  userId = decodeURIComponent(userId).replace(/^["']|["']$/g, "").trim();

  // 3. Try finding in database
  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ id: userId }, { email: userId.toLowerCase() }],
      },
    });
    if (user) return user;
  } catch (err) {
    console.error("getSessionUser prisma query error:", err);
  }

  // 4. Fallback for demo users
  if (DEMO_FALLBACK_USERS[userId]) {
    return DEMO_FALLBACK_USERS[userId];
  }

  const normalized = userId.toLowerCase();
  for (const [key, fallbackUser] of Object.entries(DEMO_FALLBACK_USERS)) {
    if (
      key.toLowerCase() === normalized ||
      fallbackUser.email.toLowerCase() === normalized ||
      fallbackUser.role.toLowerCase() === normalized
    ) {
      return fallbackUser;
    }
  }

  return null;
}

export async function requireUser(roles?: string[], req?: Request): Promise<User> {
  const user = await getSessionUser(req);
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
