import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatINR(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    PENDING: "Pending",
    ASSIGNED: "Assigned",
    OUT_FOR_DELIVERY: "Out for delivery",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
  };
  return map[status] ?? status;
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-800",
    ASSIGNED: "bg-blue-100 text-blue-800",
    OUT_FOR_DELIVERY: "bg-indigo-100 text-indigo-800",
    DELIVERED: "bg-emerald-100 text-emerald-800",
    CANCELLED: "bg-rose-100 text-rose-800",
  };
  return map[status] ?? "bg-slate-100 text-slate-800";
}
