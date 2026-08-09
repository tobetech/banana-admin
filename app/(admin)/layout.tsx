import { requireAuth } from "@/lib/auth";
import AdminShell from "@/components/AdminShell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = requireAuth(); // redirect ไป /login อัตโนมัติถ้าไม่ได้ login

  return <AdminShell role={session.role}>{children}</AdminShell>;
}
