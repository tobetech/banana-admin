"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Member = {
  id: string;
  name: string;
  phone: string | null;
  rfid_uid: string;
  credit: string;
  is_active: boolean;
};

export default function TopupClient({ members }: { members: Member[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Member | null>(null);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return members
      .filter(
        (m) =>
          m.is_active &&
          (m.name.toLowerCase().includes(q) ||
            m.rfid_uid.toLowerCase().includes(q) ||
            (m.phone ?? "").includes(q))
      )
      .slice(0, 8);
  }, [members, search]);

  async function submitTopup(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setLoading(true);
    setMessage(null);
    const res = await fetch(`/api/members/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "topup", amount: Number(amount) }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.success) {
      setMessage({ type: "success", text: `เติมเงินสำเร็จ - ยอดใหม่ ฿${Number(data.credit).toLocaleString()}` });
      setSelected({ ...selected, credit: data.credit });
      setAmount("");
      router.refresh();
    } else {
      setMessage({ type: "error", text: "เติมเงินไม่สำเร็จ" });
    }
  }

  return (
    <div className="p-6 max-w-lg space-y-4">
      <div className="bg-panel border border-border rounded-2xl p-5 space-y-3">
        <label className="block text-xs text-muted">ค้นหาสมาชิก (ชื่อ / เบอร์โทร / UID บัตร)</label>
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setSelected(null);
            setMessage(null);
          }}
          placeholder="พิมพ์เพื่อค้นหา..."
          className="input"
          autoFocus
        />
        {results.length > 0 && !selected && (
          <div className="border border-border rounded-lg divide-y divide-border overflow-hidden">
            {results.map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  setSelected(m);
                  setSearch(m.name);
                }}
                className="w-full text-left px-3 py-2.5 hover:bg-panel2 transition flex items-center justify-between"
              >
                <div>
                  <p className="text-white text-sm">{m.name}</p>
                  <p className="text-muted text-xs font-mono">{m.rfid_uid}</p>
                </div>
                <span className="text-gold text-sm">฿{Number(m.credit).toLocaleString()}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="bg-panel border border-border rounded-2xl p-5 space-y-4">
          <div>
            <p className="text-white font-medium">{selected.name}</p>
            <p className="text-muted text-xs font-mono">{selected.rfid_uid}</p>
            <p className="text-gold text-lg font-bold mt-1">฿{Number(selected.credit).toLocaleString()}</p>
          </div>
          <form onSubmit={submitTopup} className="space-y-3">
            <div>
              <label className="block text-xs text-muted mb-1">จำนวนเงินที่เติม (บาท)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={1}
                required
                className="input"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "กำลังบันทึก..." : "ยืนยันเติมเงิน"}
            </button>
          </form>
        </div>
      )}

      {message && (
        <p className={`text-sm ${message.type === "success" ? "text-accent2" : "text-danger"}`}>{message.text}</p>
      )}
    </div>
  );
}
