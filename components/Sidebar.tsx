"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const baseMenuItems = [
  { label: "Dashboard", href: "/dashboard", icon: "▦", active: true },
  { label: "จัดการสมาชิก", href: "/members", icon: "◐", active: true },
  { label: "จัดการเครื่อง", href: "/machines", icon: "▭", active: true },
  { label: "ธุรกรรม", href: "/transactions", icon: "▤", active: true },
  { label: "จัดการ Admin", href: "#", icon: "◎", active: false, superAdminOnly: true },
  { label: "Service Card", href: "#", icon: "▥", active: false },
  { label: "เติมเงินสมาชิก", href: "/topup", icon: "⊕", active: true },
  { label: "ตั้งค่าโปรโมชั่น", href: "#", icon: "☆", active: false },
  { label: "รายงานรายเดือน", href: "/reports", icon: "▤", active: true },
  { label: "Log Admin", href: "/logs", icon: "◎", active: true },
];

export default function Sidebar({
  open,
  onClose,
  role,
}: {
  open: boolean;
  onClose: () => void;
  role: "admin" | "super_admin";
}) {
  const pathname = usePathname();

  const menuItems = baseMenuItems.map((item) =>
    item.superAdminOnly && role === "super_admin"
      ? { ...item, href: "/admins", active: true }
      : item
  );

  return (
    <aside
      className={`w-64 shrink-0 bg-panel border-r border-border flex flex-col h-screen
        fixed inset-y-0 left-0 z-40 transition-transform duration-200 ease-out
        md:sticky md:top-0 md:translate-x-0
        ${open ? "translate-x-0" : "-translate-x-full"}`}
    >
      <div className="px-5 py-5 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-white font-bold text-lg">Banana Land</h1>
          <p className="text-muted text-xs mt-0.5">Admin</p>
        </div>
        <button onClick={onClose} className="md:hidden text-muted hover:text-white p-1">
          ✕
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {menuItems.map((item) => {
          const isCurrent = item.active && pathname.startsWith(item.href.split("?")[0]) && item.href !== "#";
          if (!item.active) {
            return (
              <div
                key={item.label}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted/50 text-sm cursor-not-allowed select-none"
                title="เร็วๆ นี้"
              >
                <span className="w-4 text-center">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                <span className="text-[10px] bg-border px-1.5 py-0.5 rounded">เร็วๆ นี้</span>
              </div>
            );
          }
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                isCurrent
                  ? "bg-accent text-gray-900 font-semibold"
                  : "text-gray-300 hover:bg-panel2"
              }`}
            >
              <span className="w-4 text-center">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-2 py-3 border-t border-border">
        <LogoutButton />
      </div>
    </aside>
  );
}

function LogoutButton() {
  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }
  return (
    <button
      onClick={handleLogout}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-panel2 transition"
    >
      <span className="w-4 text-center">↩</span>
      <span>ออกจากระบบ</span>
    </button>
  );
}
