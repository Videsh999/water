import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

function initDatabaseUrl() {
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  const currentUrl = process.env.DATABASE_URL || "file:./dev.db";

  if (isServerless && currentUrl.startsWith("file:")) {
    const tmpDbPath = "/tmp/dev.db";
    const candidates = [
      path.join(process.cwd(), "prisma", "dev.db"),
      path.join(process.cwd(), "dev.db"),
    ];

    if (!fs.existsSync(tmpDbPath)) {
      for (const p of candidates) {
        if (fs.existsSync(p)) {
          try {
            fs.copyFileSync(p, tmpDbPath);
            break;
          } catch (err) {
            console.error("Failed to copy SQLite database to /tmp:", err);
          }
        }
      }
    }
    process.env.DATABASE_URL = `file:${tmpDbPath}`;
  }
}

initDatabaseUrl();

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
