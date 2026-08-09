import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { queryOne } from "@/lib/db";
import { logAdminAction, getClientIp } from "@/lib/auditLog";

export async function POST(req: NextRequest) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { name, phone, rfid_uid, initial_credit } = await req.json();
  if (!name || !rfid_uid) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const result = await queryOne<any>(
    `select vending.fn_register_card($1, $2, $3, $4) as result`,
    [rfid_uid, name, phone || null, initial_credit || 0]
  );

  const data = result?.result ?? { success: false, error: "unknown_error" };
  if (data.success) {
    await logAdminAction(
      session.username,
      "member_register",
      { name, phone, rfid_uid, initial_credit: initial_credit || 0 },
      getClientIp(req)
    );
  }

  return NextResponse.json(data);
}
