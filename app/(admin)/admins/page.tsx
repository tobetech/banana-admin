import { query } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/auth";
import Topbar from "@/components/Topbar";
import AdminUsersClient from "@/components/AdminUsersClient";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const session = requireSuperAdmin(); // redirect ไป /dashboard ถ้าไม่ใช่ super_admin

  const admins = await query(
    `select id, username, role, is_active, last_login_at, created_at
     from vending.admin_users
     order by created_at desc`
  );

  return (
    <>
      <Topbar title="จัดการ Admin" username={session.username} role={session.role} />
      <AdminUsersClient admins={admins as any} currentUsername={session.username} />
    </>
  );
}
