import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createSessionToken, SESSION_COOKIE_NAME, AdminRole } from "@/lib/session";
import { logAdminAction, getClientIp } from "@/lib/auditLog";
import { queryOne, pool } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  if (!username || !password) {
    return NextResponse.json({ success: false, error: "missing_fields" }, { status: 400 });
  }

  let role: AdminRole | null = null;

  // 1. เช็คจากตาราง vending.admin_users ก่อน
  const row = await queryOne<{ id: string; password_hash: string; role: AdminRole }>(
    `select id, password_hash, role from vending.admin_users where username = $1 and is_active = true`,
    [username]
  );
  if (row && (await bcrypt.compare(password, row.password_hash))) {
    role = row.role;
    await pool.query(`update vending.admin_users set last_login_at = now() where id = $1`, [row.id]);
  }

  // 2. ถ้าไม่เจอในตาราง เช็ค env var เป็น "root account" สำรอง (กันตัวเองล็อกออกจากระบบ)
  if (!role) {
    const validUser = process.env.ADMIN_USERNAME;
    const validPass = process.env.ADMIN_PASSWORD;
    if (validUser && validPass && username === validUser && password === validPass) {
      role = "super_admin";
    }
  }

  if (!role) {
    return NextResponse.json({ success: false, error: "invalid_credentials" }, { status: 401 });
  }

  const token = createSessionToken(username, role);
  const res = NextResponse.json({ success: true });
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  await logAdminAction(username, "login", { role }, getClientIp(req));
  return res;
}
