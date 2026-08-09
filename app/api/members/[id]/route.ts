import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { queryOne } from "@/lib/db";
import { logAdminAction, getClientIp } from "@/lib/auditLog";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { action, amount } = await req.json();

  if (action === "topup") {
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "invalid_amount" }, { status: 400 });
    }
    const result = await queryOne<{ credit: string; name: string }>(
      `with upd as (
         update vending.members set credit = credit + $2, updated_at = now()
         where id = $1
         returning credit as credit_after, credit - $2 as credit_before, name
       )
       insert into vending.transactions(member_id, amount, credit_before, credit_after, type, status)
       select $1, $2, credit_before, credit_after, 'topup', 'success' from upd
       returning (select credit_after from upd) as credit, (select name from upd) as name`,
      [params.id, amount]
    );
    if (!result) return NextResponse.json({ error: "member_not_found" }, { status: 404 });
    await logAdminAction(
      session.username,
      "member_topup",
      { member_id: params.id, member_name: result.name, amount },
      getClientIp(req)
    );
    return NextResponse.json({ success: true, credit: result.credit, name: result.name });
  }

  if (action === "toggle_active") {
    const result = await queryOne<{ is_active: boolean; name: string }>(
      `update vending.members set is_active = not is_active, updated_at = now()
       where id = $1 returning is_active, name`,
      [params.id]
    );
    if (!result) return NextResponse.json({ error: "member_not_found" }, { status: 404 });
    await logAdminAction(
      session.username,
      result.is_active ? "member_reactivate" : "member_cancel",
      { member_id: params.id, member_name: result.name },
      getClientIp(req)
    );
    return NextResponse.json({ success: true, is_active: result.is_active });
  }

  return NextResponse.json({ error: "unknown_action" }, { status: 400 });
}
