"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AdminUser = {
  id: string;
  username: string;
  role: "admin" | "super_admin";
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
};

export default function AdminUsersClient({
  admins,
  currentUsername,
}: {
  admins: AdminUser[];
  currentUsername: string;
}) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null);

  async function handleToggle(a: AdminUser) {
    if (!confirm(`ยืนยัน${a.is_active ? "ปิดใช้งาน" : "เปิดใช้งาน"}บัญชี ${a.username}?`)) return;
    await fetch(`/api/admin-users/${a.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle_active" }),
    });
    router.refresh();
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-end">
        <button onClick={() => setShowAdd(true)} className="bg-accent hover:bg-accent-dark text-gray-900 text-sm font-semibold px-4 py-2 rounded-lg transition">
          + เพิ่ม Admin ใหม่
        </button>
      </div>

      <div className="bg-panel border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted text-left">
                <th className="px-5 py-3 font-normal">Username</th>
                <th className="px-5 py-3 font-normal">สิทธิ์</th>
                <th className="px-5 py-3 font-normal">สถานะ</th>
                <th className="px-5 py-3 font-normal">ล็อกอินล่าสุด</th>
                <th className="px-5 py-3 font-normal text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {/* root account จาก env var - แสดงเป็นข้อมูลอย่างเดียว จัดการผ่านตารางนี้ไม่ได้ */}
              <tr className="border-t border-border bg-panel2/30">
                <td className="px-5 py-3 text-white font-medium">
                  {currentUsername === "-" ? "(root account)" : "root account"}
                </td>
                <td className="px-5 py-3">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-accent/15 text-accent">super_admin</span>
                </td>
                <td className="px-5 py-3 text-muted text-xs">ตั้งค่าผ่าน environment variable</td>
                <td className="px-5 py-3 text-muted text-xs">-</td>
                <td className="px-5 py-3 text-right text-muted text-xs">จัดการไม่ได้ผ่านหน้านี้</td>
              </tr>

              {admins.map((a) => (
                <tr key={a.id} className="border-t border-border hover:bg-panel2/50">
                  <td className="px-5 py-3 text-white font-medium">{a.username}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full ${
                        a.role === "super_admin" ? "bg-accent/15 text-accent" : "bg-panel2 text-gray-300"
                      }`}
                    >
                      {a.role}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full ${
                        a.is_active ? "bg-accent2/15 text-accent2" : "bg-danger/15 text-danger"
                      }`}
                    >
                      {a.is_active ? "ใช้งานอยู่" : "ปิดใช้งาน"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-muted text-xs">
                    {a.last_login_at ? new Date(a.last_login_at).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" }) : "ยังไม่เคยล็อกอิน"}
                  </td>
                  <td className="px-5 py-3 text-right space-x-2">
                    <button
                      onClick={() => setResetTarget(a)}
                      className="text-accent hover:underline text-xs font-medium"
                    >
                      ตั้งรหัสใหม่
                    </button>
                    <button
                      onClick={() => handleToggle(a)}
                      className="text-danger hover:underline text-xs font-medium"
                    >
                      {a.is_active ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && <AddAdminModal onClose={() => setShowAdd(false)} onDone={() => router.refresh()} />}
      {resetTarget && (
        <ResetPasswordModal admin={resetTarget} onClose={() => setResetTarget(null)} onDone={() => router.refresh()} />
      )}
    </div>
  );
}

function AddAdminModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "super_admin">("admin");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/admin-users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, role }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.success) {
      onDone();
      onClose();
    } else {
      setError(
        data.error === "username_exists"
          ? "มี username นี้อยู่แล้ว"
          : data.error === "password_too_short"
          ? "รหัสผ่านสั้นเกินไป (อย่างน้อย 8 ตัว)"
          : "สร้างไม่สำเร็จ"
      );
    }
  }

  return (
    <Modal title="เพิ่ม Admin ใหม่" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Username">
          <input value={username} onChange={(e) => setUsername(e.target.value)} required className="input" />
        </Field>
        <Field label="รหัสผ่าน (อย่างน้อย 8 ตัว)">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="input"
          />
        </Field>
        <Field label="สิทธิ์">
          <select value={role} onChange={(e) => setRole(e.target.value as any)} className="input">
            <option value="admin">admin (ใช้งานทั่วไป)</option>
            <option value="super_admin">super_admin (จัดการ admin คนอื่นได้)</option>
          </select>
        </Field>
        {error && <p className="text-danger text-sm">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "กำลังสร้าง..." : "สร้างบัญชี"}
        </button>
      </form>
    </Modal>
  );
}

function ResetPasswordModal({
  admin,
  onClose,
  onDone,
}: {
  admin: AdminUser;
  onClose: () => void;
  onDone: () => void;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch(`/api/admin-users/${admin.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset_password", new_password: password }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.success) {
      onDone();
      onClose();
    } else {
      setError("ตั้งรหัสผ่านใหม่ไม่สำเร็จ");
    }
  }

  return (
    <Modal title={`ตั้งรหัสผ่านใหม่ - ${admin.username}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="รหัสผ่านใหม่ (อย่างน้อย 8 ตัว)">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoFocus
            className="input"
          />
        </Field>
        {error && <p className="text-danger text-sm">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "กำลังบันทึก..." : "ยืนยัน"}
        </button>
      </form>
    </Modal>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div
        className="bg-panel border border-border rounded-2xl p-6 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">{title}</h3>
          <button onClick={onClose} className="text-muted hover:text-white">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-muted mb-1">{label}</label>
      {children}
    </div>
  );
}
