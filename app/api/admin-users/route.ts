import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth";
import { queryOne } from "@/lib/db";
import { logAdminAction, getClientIp } from "@/lib/auditLog";

export async function POST(req: NextRequest) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (session.role !== "super_admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { username, password, role } = await req.json();
  if (!username || !password) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "password_too_short" }, { status: 400 });
  }
  const finalRole = role === "super_admin" ? "super_admin" : "admin";

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    await queryOne(
      `insert into vending.admin_users (username, password_hash, role) values ($1, $2, $3)`,
      [username, passwordHash, finalRole]
    );
  } catch (e: any) {
    if (e.code === "23505") {
      return NextResponse.json({ error: "username_exists" }, { status: 409 });
    }
    throw e;
  }

  await logAdminAction(
    session.username,
    "admin_create",
    { username, role: finalRole },
    getClientIp(req)
  );

  return NextResponse.json({ success: true });
}
