import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { queryOne } from "@/lib/db";
import { logAdminAction, getClientIp } from "@/lib/auditLog";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { price, location, pulse_mode, pulse_width_ms, key_status, machine_name } = await req.json();

  const result = await queryOne(
    `update vending.machines
     set price = coalesce($2, price),
         location = coalesce($3, location),
         pulse_mode = coalesce($4, pulse_mode),
         pulse_width_ms = coalesce($5, pulse_width_ms),
         key_status = coalesce($6, key_status),
         machine_name = coalesce($7, machine_name)
     where machine_id = $1
     returning machine_id`,
    [params.id, price, location, pulse_mode, pulse_width_ms, key_status, machine_name]
  );

  if (!result) return NextResponse.json({ error: "machine_not_found" }, { status: 404 });

  await logAdminAction(
    session.username,
    "machine_update",
    { machine_id: params.id, machine_name, price, location, pulse_mode, pulse_width_ms, key_status },
    getClientIp(req)
  );

  return NextResponse.json({ success: true });
}
