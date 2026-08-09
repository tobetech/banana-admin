import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import Topbar from "@/components/Topbar";
import MachinesClient from "@/components/MachinesClient";

export const dynamic = "force-dynamic";

export default async function MachinesPage() {
  const session = getSession();
  const machines = await query(
    `select machine_id, machine_name, location, price::text as price, pulse_mode, key_status, last_seen,
       case when now() - last_seen < interval '10 minutes' then 'online' else 'offline' end as status
     from vending.machines
     order by machine_id`
  );

  return (
    <>
      <Topbar title="จัดการเครื่อง" username={session?.username ?? "Admin"} role={session?.role} />
      <MachinesClient machines={machines as any} />
    </>
  );
}
