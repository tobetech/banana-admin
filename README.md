# VendShop Admin

ระบบหลังบ้าน (Next.js) สำหรับดูแลระบบตู้คีบ/ตู้เติมเงิน ต่อข้อมูลจริงจาก schema `vending` ใน Supabase

## เฟสนี้ทำอะไรบ้าง

- **Dashboard** — สถิติสมาชิก/เครื่อง Online/รายได้ + กราฟรายได้ (Bar/Line/Pie, รายวัน/รายเดือน) + Top 5 เครื่อง + ตารางสถานะเครื่อง
- **จัดการสมาชิก** — ค้นหา, ลงทะเบียนใหม่, เติมเงิน, ยกเลิก/เปิดใช้งานบัตร
- **จัดการเครื่อง** — ดูรายการ, เพิ่มเครื่องใหม่พร้อม generate API key อัตโนมัติ, แก้ราคา/pulse mode/สถานะ key
- **ธุรกรรม** — ดูประวัติทั้งหมด กรองตามประเภท
- **เติมเงินสมาชิก** — หน้าเติมเงินด่วน (ค้นหาแล้วเติมทันที)
- **รายงานรายเดือน** — สรุปรายเดือน + export CSV
- **Log Admin** — ประวัติการกระทำทั้งหมด (รวมจาก `kiosk-card-app` ด้วย เพราะใช้ตารางเดียวกัน)
- **จัดการ Admin** — เพิ่ม/ปิดใช้งาน/ตั้งรหัสผ่านใหม่ให้ admin คนอื่น (**เห็นเฉพาะ super_admin เท่านั้น**)

เมนูอื่นในแถบซ้าย (Whitelist, ตั้งค่าโปรโมชั่น ฯลฯ) ยังเป็น placeholder เพราะยังไม่มีตารางรองรับใน database — ทำเพิ่มได้ทีหลัง

## ระบบ Admin หลายคน (multi-admin)

มี 2 ชั้น:

1. **Root account** — คือ `ADMIN_USERNAME`/`ADMIN_PASSWORD` ใน env var ตัวเดิม เป็น **super_admin เสมอ** และ**จัดการผ่านหน้าเว็บไม่ได้** (กันตัวเองล็อกออกจากระบบ) ใช้ตอน bootstrap ระบบครั้งแรก หรือกรณีฉุกเฉินเข้าระบบไม่ได้
2. **Admin ในตาราง `vending.admin_users`** — เพิ่ม/ลบ/ปิดใช้งานได้ผ่านเมนู "จัดการ Admin" (ต้อง login เป็น super_admin ก่อน) รหัสผ่านเก็บแบบ hash (bcrypt) ไม่เก็บ plaintext

**สิทธิ์ 2 ระดับ:**
- `admin` — ใช้งานเมนูทั่วไปได้หมด ยกเว้น "จัดการ Admin"
- `super_admin` — ใช้งานได้ทุกเมนู รวม "จัดการ Admin"

## ติดตั้ง

```bash
npm install
cp .env.local.example .env.local
```

แก้ `.env.local` ใส่ค่าจริง 3 ตัว:

1. `VENDING_DB_URL` — เอาจาก Supabase Dashboard → Connect → URI → **Session pooler** (พอร์ต 5432 ไม่ใช่ 6543 เพราะ `pg` library ใช้ prepared statement ซึ่งเข้ากับ Transaction pooler ไม่ได้ เหมือนปัญหาที่เจอตอนทำ Edge Function)
2. `ADMIN_USERNAME` / `ADMIN_PASSWORD` — ล็อกอินเข้าระบบนี้ ตั้งเอง
3. `SESSION_SECRET` — รัน `openssl rand -hex 32` แล้วเอาผลลัพธ์มาใส่

รันทดสอบบนเครื่อง:

```bash
npm run dev
```

เปิด http://localhost:3000

## Deploy ขึ้น Vercel

1. Push โค้ดขึ้น GitHub (ดู git commands ด้านล่าง)
2. ไปที่ vercel.com/new → Import repo นี้
3. **ก่อนกด Deploy** ไปที่ Environment Variables ใส่ทั้ง 3 ค่า (`VENDING_DB_URL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `SESSION_SECRET`) — ห้ามลืม ไม่งั้น build ผ่านแต่ใช้งานไม่ได้
4. Deploy
5. ปิด "Vercel Authentication" ที่ Settings → Deployment Protection เหมือนโปรเจกต์อื่นที่เคยทำมา

## คำสั่ง Git (ครั้งแรก)

```bash
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/vendshop-admin.git
git push -u origin main
```
