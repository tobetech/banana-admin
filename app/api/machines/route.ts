import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getSession } from "@/lib/auth";
import { queryOne } from "@/lib/db";
import { logAdminAction, getClientIp } from "@/lib/auditLog";

export async function POST(req: NextRequest) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { machine_id, machine_name, location, price } = await req.json();
  if (!machine_id) return NextResponse.json({ error: "missing_machine_id" }, { status: 400 });

  // สร้าง API key แบบสุ่ม + เก็บแค่ hash ลง DB (เหมือนแพทเทิร์นตอน provision VM-001 ถึง VM-020 ด้วยมือ)
  const apiKey = crypto.randomBytes(32).toString("hex");
  const apiKeyHash = crypto.createHash("sha256").update(apiKey).digest("hex");

  try {
    await queryOne(
      `insert into vending.machines (machine_id, machine_name, location, api_key_hash, key_status, price)
       values ($1, $2, $3, $4, 'active', $5)`,
      [machine_id, machine_name || null, location || "TBD", apiKeyHash, price || 10]
    );
  } catch (e: any) {
    if (e.code === "23505") {
      return NextResponse.json({ error: "machine_id_exists" }, { status: 409 });
    }
    throw e;
  }

  // หมายเหตุ: ห้าม log api_key ตัวจริงเด็ดขาด - log แค่ metadata
  await logAdminAction(
    session.username,
    "machine_create",
    { machine_id, machine_name, location: location || "TBD", price: price || 10 },
    getClientIp(req)
  );

  // คืน key ตัวจริงแค่ครั้งเดียว - ฝั่งหน้าเว็บต้อง copy เก็บทันที เพราะ DB ไม่เก็บ plaintext
  return NextResponse.json({ success: true, machine_id, api_key: apiKey });
}
