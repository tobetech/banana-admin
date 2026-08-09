"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";

export default function AdminShell({
  children,
  role,
}: {
  children: React.ReactNode;
  role: "admin" | "super_admin";
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-bg">
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <Sidebar open={open} onClose={() => setOpen(false)} role={role} />

      <div className="flex-1 min-w-0">
        {/* แถบบนสำหรับมือถือ - ปุ่มเปิดเมนู (จอใหญ่ไม่โชว์ เพราะ sidebar โชว์ค้างอยู่แล้ว) */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-bg sticky top-0 z-20">
          <button onClick={() => setOpen(true)} className="text-white p-1 -ml-1" aria-label="เปิดเมนู">
            <span className="text-2xl leading-none">☰</span>
          </button>
          <span className="text-white font-semibold text-sm">Banana Land</span>
        </div>

        <main>{children}</main>
      </div>
    </div>
  );
}
