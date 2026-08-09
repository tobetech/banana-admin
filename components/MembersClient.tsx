"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Member = {
  id: string;
  name: string;
  phone: string | null;
  rfid_uid: string;
  credit: string;
  is_active: boolean;
  created_at: string;
};

export default function MembersClient({ members }: { members: Member[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [showRegister, setShowRegister] = useState(searchParams.get("new") === "1");
  const [topupTarget, setTopupTarget] = useState<Member | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.rfid_uid.toLowerCase().includes(q) ||
        (m.phone ?? "").includes(q)
    );
  }, [members, search]);

  async function handleToggleActive(m: Member) {
    if (!confirm(`ยืนยัน${m.is_active ? "ยกเลิก" : "เปิดใช้งาน"}บัตรของ ${m.name}?`)) return;
    await fetch(`/api/members/${m.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle_active" }),
    });
    router.refresh();
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <input
          type="text"
          placeholder="ค้นหาชื่อ / เบอร์โทร / UID บัตร..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-panel2 border border-border rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-accent w-full sm:w-72"
        />
        <button
          onClick={() => setShowRegister(true)}
          className="bg-accent hover:bg-accent-dark text-gray-900 text-sm font-semibold px-4 py-2 rounded-lg transition"
        >
          + ลงทะเบียนสมาชิกใหม่
        </button>
      </div>

      <div className="bg-panel border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted text-left">
                <th className="px-5 py-3 font-normal">ชื่อ</th>
                <th className="px-5 py-3 font-normal">เบอร์โทร</th>
                <th className="px-5 py-3 font-normal">UID บัตร</th>
                <th className="px-5 py-3 font-normal">เครดิต</th>
                <th className="px-5 py-3 font-normal">สถานะ</th>
                <th className="px-5 py-3 font-normal text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id} className="border-t border-border hover:bg-panel2/50">
                  <td className="px-5 py-3 text-white font-medium">{m.name}</td>
                  <td className="px-5 py-3 text-gray-300">{m.phone ?? "-"}</td>
                  <td className="px-5 py-3 text-gray-300 font-mono text-xs">{m.rfid_uid}</td>
                  <td className="px-5 py-3 text-gold font-medium">฿{Number(m.credit).toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full ${
                        m.is_active ? "bg-accent2/15 text-accent2" : "bg-danger/15 text-danger"
                      }`}
                    >
                      {m.is_active ? "ใช้งานอยู่" : "ยกเลิกแล้ว"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right space-x-2">
                    <button
                      onClick={() => setTopupTarget(m)}
                      className="text-accent hover:underline text-xs font-medium"
                    >
                      เติมเงิน
                    </button>
                    <button
                      onClick={() => handleToggleActive(m)}
                      className="text-danger hover:underline text-xs font-medium"
                    >
                      {m.is_active ? "ยกเลิกบัตร" : "เปิดใช้งาน"}
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-muted">
                    ไม่พบสมาชิกที่ค้นหา
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showRegister && <RegisterModal onClose={() => setShowRegister(false)} onDone={() => router.refresh()} />}
      {topupTarget && (
        <TopupModal member={topupTarget} onClose={() => setTopupTarget(null)} onDone={() => router.refresh()} />
      )}
    </div>
  );
}

function RegisterModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [rfid, setRfid] = useState("");
  const [credit, setCredit] = useState("0");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, rfid_uid: rfid.toUpperCase(), initial_credit: Number(credit) || 0 }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.success) {
      onDone();
      onClose();
    } else {
      setError(data.error === "card_already_registered" ? "บัตรนี้ลงทะเบียนแล้ว" : "บันทึกไม่สำเร็จ");
    }
  }

  return (
    <Modal onClose={onClose} title="ลงทะเบียนสมาชิกใหม่">
      <form onSubmit={submit} className="space-y-3">
        <Field label="ชื่อลูกค้า">
          <input value={name} onChange={(e) => setName(e.target.value)} required className="input" />
        </Field>
        <Field label="เบอร์โทร (ไม่บังคับ)">
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input" />
        </Field>
        <Field label="UID บัตร">
          <input value={rfid} onChange={(e) => setRfid(e.target.value)} required className="input font-mono" />
        </Field>
        <Field label="เครดิตเริ่มต้น (บาท)">
          <input type="number" value={credit} onChange={(e) => setCredit(e.target.value)} min={0} className="input" />
        </Field>
        {error && <p className="text-danger text-sm">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "กำลังบันทึก..." : "บันทึก"}
        </button>
      </form>
    </Modal>
  );
}

function TopupModal({
  member,
  onClose,
  onDone,
}: {
  member: Member;
  onClose: () => void;
  onDone: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch(`/api/members/${member.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "topup", amount: Number(amount) }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.success) {
      onDone();
      onClose();
    } else {
      setError("เติมเงินไม่สำเร็จ");
    }
  }

  return (
    <Modal onClose={onClose} title={`เติมเงิน - ${member.name}`}>
      <p className="text-muted text-sm mb-3">ยอดปัจจุบัน ฿{Number(member.credit).toLocaleString()}</p>
      <form onSubmit={submit} className="space-y-3">
        <Field label="จำนวนเงินที่เติม (บาท)">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min={1}
            required
            autoFocus
            className="input"
          />
        </Field>
        {error && <p className="text-danger text-sm">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "กำลังบันทึก..." : "ยืนยันเติมเงิน"}
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
