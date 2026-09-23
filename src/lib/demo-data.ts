import type { Product, Zone, User } from "@prisma/client";

export const DEMO_ACCOUNTS = [
  {
    id: "cmuecdg1d0008v5xbx9l3gb3r",
    role: "CUSTOMER",
    email: "customer@water.hyderabad",
    password: "customer123",
    name: "Priya Sharma",
    phone: "+91 90000 00003",
    zoneId: "zone-gachibowli",
    createdAt: new Date(),
  },
  {
    id: "cmuecdg1b0007v5xbd2iby1lr",
    role: "DRIVER",
    email: "driver@water.hyderabad",
    password: "driver123",
    name: "Ravi Kumar",
    phone: "+91 90000 00002",
    zoneId: "zone-gachibowli",
    createdAt: new Date(),
  },
  {
    id: "cmuecdg190005v5xb8qit7yxv",
    role: "ADMIN",
    email: "admin@water.hyderabad",
    password: "admin123",
    name: "Water Admin",
    phone: "+91 90000 00001",
    zoneId: null,
    createdAt: new Date(),
  },
] as User[];

export const FALLBACK_ZONES: Zone[] = [
  { id: "zone-gachibowli", name: "Gachibowli", city: "Hyderabad", createdAt: new Date() },
  { id: "zone-madhapur", name: "Madhapur", city: "Hyderabad", createdAt: new Date() },
  { id: "zone-hitech", name: "Hitech City", city: "Hyderabad", createdAt: new Date() },
  { id: "zone-banjara", name: "Banjara Hills", city: "Hyderabad", createdAt: new Date() },
  { id: "zone-jubilee", name: "Jubilee Hills", city: "Hyderabad", createdAt: new Date() },
];

export const FALLBACK_PRODUCTS: Product[] = [
  {
    id: "prod-20l-jar",
    name: "20L Jar",
    description: "Purified 20-litre mineral water jar — refill & exchange friendly.",
    priceInPaise: 4000,
    unit: "jar",
    emoji: "🫙",
    active: true,
    sortOrder: 1,
    createdAt: new Date(),
  },
  {
    id: "prod-1l-pack",
    name: "1L Bottled Pack (12)",
    description: "Pack of 12 × 1L purified drinking water bottles.",
    priceInPaise: 18000,
    unit: "pack",
    emoji: "📦",
    active: true,
    sortOrder: 2,
    createdAt: new Date(),
  },
  {
    id: "prod-500ml-pack",
    name: "500ml Bottled Pack (24)",
    description: "Pack of 24 × 500ml bottles — ideal for offices & events.",
    priceInPaise: 22000,
    unit: "pack",
    emoji: "💧",
    active: true,
    sortOrder: 3,
    createdAt: new Date(),
  },
];
