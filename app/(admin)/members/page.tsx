import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import Topbar from "@/components/Topbar";
import MembersClient from "@/components/MembersClient";

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  const session = getSession();
  const members = await query(
    `select id, name, phone, rfid_uid, credit::text as credit, is_active, created_at
     from vending.members
     order by created_at desc`
  );

  return (
    <>
      <Topbar title="จัดการสมาชิก" username={session?.username ?? "Admin"} role={session?.role} />
      <MembersClient members={members as any} />
    </>
  );
}
