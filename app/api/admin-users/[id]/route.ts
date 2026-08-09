import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth";
import { queryOne } from "@/lib/db";
import { logAdminAction, getClientIp } from "@/lib/auditLog";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (session.role !== "super_admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { action, new_password } = await req.json();

  if (action === "toggle_active") {
    const result = await queryOne<{ is_active: boolean; username: string }>(
      `update vending.admin_users set is_active = not is_active where id = $1 returning is_active, username`,
      [params.id]
    );
    if (!result) return NextResponse.json({ error: "not_found" }, { status: 404 });
    await logAdminAction(
      session.username,
      result.is_active ? "admin_reactivate" : "admin_deactivate",
      { target_username: result.username },
      getClientIp(req)
    );
    return NextResponse.json({ success: true, is_active: result.is_active });
  }

  if (action === "reset_password") {
    if (!new_password || new_password.length < 8) {
      return NextResponse.json({ error: "password_too_short" }, { status: 400 });
    }
    const passwordHash = await bcrypt.hash(new_password, 10);
    const result = await queryOne<{ username: string }>(
      `update vending.admin_users set password_hash = $2 where id = $1 returning username`,
      [params.id, passwordHash]
    );
    if (!result) return NextResponse.json({ error: "not_found" }, { status: 404 });
    await logAdminAction(
      session.username,
      "admin_reset_password",
      { target_username: result.username },
      getClientIp(req)
    );
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "unknown_action" }, { status: 400 });
}
