import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TopNav } from "@/components/nav";
import { getSessionUser } from "@/lib/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Water — Hyderabad water delivery",
  description:
    "Water delivery platform for Hyderabad. Order 20L jars and bottled packs, track deliveries.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getSessionUser();

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <TopNav
          user={
            user
              ? { name: user.name, role: user.role as "CUSTOMER" | "DRIVER" | "ADMIN" }
              : null
          }
        />
        <main className="mx-auto max-w-5xl px-4 py-6 pb-16">{children}</main>
      </body>
    </html>
  );
}
