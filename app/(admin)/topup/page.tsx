import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import Topbar from "@/components/Topbar";
import TopupClient from "@/components/TopupClient";

export const dynamic = "force-dynamic";

export default async function TopupPage() {
  const session = getSession();
  const members = await query(
    `select id, name, phone, rfid_uid, credit::text as credit, is_active
     from vending.members
     where is_active = true
     order by name`
  );

  return (
    <>
      <Topbar title="เติมเงินสมาชิก" username={session?.username ?? "Admin"} role={session?.role} />
      <TopupClient members={members as any} />
    </>
  );
}
