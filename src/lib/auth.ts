import { cookies } from "next/headers";
import { prisma } from "./prisma";
import type { User } from "@prisma/client";

const COOKIE = "water_session";

export async function getSessionUser(): Promise<User | null> {
  const jar = await cookies();
  const userId = jar.get(COOKIE)?.value;
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId } });
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
