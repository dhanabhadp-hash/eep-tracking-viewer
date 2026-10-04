# e-EP Tracking Viewer

ระบบติดตามการจัดซื้อเวชภัณฑ์ — ห้องยา โรงพยาบาลสบปราบ
®TNP Developer 2027 Sobprab Pharmacy Department

Full-stack PWA: React 19 (Vite) + Tailwind CSS + shadcn/ui · Hono + tRPC 11 + Drizzle ORM (MySQL) · ดึงข้อมูลจาก Google Sheets (Publish-to-web CSV)

## Features

- **Dashboard** — KPI รายการจัดซื้อ / สถานะรับยาจากขนส่ง / มูลค่ารวม, กราฟโดนัทสถานะรับยา, กราฟแท่งมูลค่าแยกบริษัท (Recharts)
- **Master View** — TanStack Table: global search, column filters, sorting, pagination, แบ่งกลุ่มตามเลข PO พร้อมยอดรวม
- **Detail View** — รายละเอียดทุกฟิลด์ของแถว พร้อม Row ID (เลขบรรทัดจริงใน Google Sheets)
- **บันทึกข้อมูลจากเว็บ** — แก้ไข เลขที่โครงการ / เลขคุมสัญญา / NOTE ผูกกับ Row ID ลงฐานข้อมูล MySQL (ไม่แตะต้นฉบับในชีต)
- **Auto sync** — รีเฟรชข้อมูลชีตทุก 1 นาที + เมื่อกลับมาที่แท็บ (React Query)
- **PWA** — ติดตั้งเป็นแอปได้, service worker cache หน้าเว็บ (ข้อมูลชีต/API ดึงสดเสมอ)

## Setup

```bash
npm install
cp .env.example .env   # ใส่ DATABASE_URL ของ MySQL
npm run db:push        # สร้างตาราง sheet_edits
python3 scripts/make-icons.py   # สร้างไอคอน PNG สำหรับ PWA (ต้องมี pillow)
npm run dev            # http://localhost:3000
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Dev server with HMR |
| `npm run build` | Production build (dist/) |
| `npm start` | Start production server |
| `npm run check` | Type-check |
| `npm run db:push` | Sync Drizzle schema to DB |

## Structure

- `src/` — frontend (pages, components, hooks, lib)
- `api/` — Hono + tRPC server (`router.ts`, `queries/`)
- `db/` — Drizzle schema (`sheet_edits` table)
- `contracts/` — shared types
- `public/` — PWA manifest, service worker, icons
