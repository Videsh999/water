# Water — Hyderabad water delivery

**Water** is a local-first water delivery platform launching in **Hyderabad, India**.

Day-one loop:

1. **Customer** places a one-time or subscription order  
2. **Admin** sees the order and assigns a driver  
3. **Driver** marks the stop delivered  
4. **Customer** tracks status end-to-end  

Payments are **stubbed** (orders are marked paid). Razorpay / UPI can be wired later.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind CSS  
- SQLite via Prisma (no cloud DB required)  
- Single app with role routes: `/` (customer), `/driver`, `/admin`

## Quick start

```bash
cd /workspace/water   # or clone path
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Useful scripts

| Script | What it does |
|--------|----------------|
| `npm run dev` | Start local dev server |
| `npm run db:seed` | Reseed zones, products, demo users |
| `npm run db:reset` | Reset SQLite DB + reseed |
| `npm run build` | Production build |

## Demo logins

| Role | Email | Password |
|------|-------|----------|
| Customer | `customer@water.hyderabad` | `customer123` |
| Driver | `driver@water.hyderabad` | `driver123` |
| Admin | `admin@water.hyderabad` | `admin123` |

## Key routes

| Path | Role | Purpose |
|------|------|---------|
| `/` | Public | Landing; redirects signed-in users |
| `/login` | Public | Sign in (quick-fill demo accounts) |
| `/products` | Customer | Browse catalog + place order |
| `/orders` | Customer | Order list |
| `/orders/[id]` | Customer | Track status |
| `/admin` | Admin | Orders, assign drivers, inventory-lite |
| `/driver` | Driver | Assigned deliveries, mark delivered |

## Seed data

- **Zones:** Gachibowli, Madhapur, Hitech City, Banjara Hills, Jubilee Hills  
- **Products:** 20L jar, 1L bottled pack (12), 500ml bottled pack (24)  
- One sample **pending** customer order for the admin queue  

## Project layout

```
src/
  app/
    (customer)/products|orders   # customer UI
    admin/                       # admin UI
    driver/                      # driver UI
    api/                         # auth + orders APIs
  components/                    # shared UI
  lib/                           # prisma, auth, helpers
prisma/
  schema.prisma
  seed.ts
```

## Notes

- Auth is cookie-based demo auth (plain passwords for local scaffolding only).  
- Do not use these credentials in production.  
- No real payment or maps APIs are integrated yet.
