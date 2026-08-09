"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Machine = {
  machine_id: string;
  machine_name: string | null;
  location: string | null;
  price: string;
  pulse_mode: string;
  key_status: string;
  status: string;
  last_seen: string | null;
};

export default function MachinesClient({ machines }: { machines: Machine[] }) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [newKeyInfo, setNewKeyInfo] = useState<{ machine_id: string; api_key: string } | null>(null);
  const [editing, setEditing] = useState<Machine | null>(null);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-end">
        <button
          onClick={() => setShowAdd(true)}
          className="bg-accent hover:bg-accent-dark text-gray-900 text-sm font-semibold px-4 py-2 rounded-lg transition"
        >
          + เพิ่มเครื่องใหม่
        </button>
      </div>

      <div className="bg-panel border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted text-left">
                <th className="px-5 py-3 font-normal">Machine ID</th>
                <th className="px-5 py-3 font-normal">ชื่อเครื่อง</th>
                <th className="px-5 py-3 font-normal">สถานที่</th>
                <th className="px-5 py-3 font-normal">ราคา/เล่น</th>
                <th className="px-5 py-3 font-normal">Pulse mode</th>
                <th className="px-5 py-3 font-normal">สถานะเชื่อมต่อ</th>
                <th className="px-5 py-3 font-normal">Key</th>
                <th className="px-5 py-3 font-normal text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {machines.map((m) => (
                <tr key={m.machine_id} className="border-t border-border hover:bg-panel2/50">
                  <td className="px-5 py-3 text-white font-medium">{m.machine_id}</td>
                  <td className="px-5 py-3 text-gray-300">{m.machine_name ?? <span className="text-muted">-</span>}</td>
                  <td className="px-5 py-3 text-gray-300">{m.location ?? "-"}</td>
                  <td className="px-5 py-3 text-gold">฿{m.price}</td>
                  <td className="px-5 py-3 text-gray-300 font-mono text-xs">{m.pulse_mode}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full ${
                        m.status === "online" ? "bg-accent2/15 text-accent2" : "bg-danger/15 text-danger"
                      }`}
                    >
                      {m.status === "online" ? "Online" : "Offline"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full ${
                        m.key_status === "active" ? "bg-accent2/15 text-accent2" : "bg-danger/15 text-danger"
                      }`}
                    >
                      {m.key_status === "active" ? "active" : "revoked"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => setEditing(m)} className="text-accent hover:underline text-xs font-medium">
                      แก้ไข
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && (
        <AddMachineModal
          onClose={() => setShowAdd(false)}
          onCreated={(info) => {
            setNewKeyInfo(info);
            router.refresh();
          }}
        />
      )}

      {editing && (
        <EditMachineModal machine={editing} onClose={() => setEditing(null)} onDone={() => router.refresh()} />
      )}

      {newKeyInfo && <ApiKeyRevealModal info={newKeyInfo} onClose={() => setNewKeyInfo(null)} />}
    </div>
  );
}

function AddMachineModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (info: { machine_id: string; api_key: string }) => void;
}) {
  const [machineId, setMachineId] = useState("");
  const [machineName, setMachineName] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("10");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/machines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        machine_id: machineId.toUpperCase(),
        machine_name: machineName,
        location,
        price: Number(price),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.success) {
      onCreated({ machine_id: data.machine_id, api_key: data.api_key });
      onClose();
    } else {
      setError(data.error === "machine_id_exists" ? "มี Machine ID นี้อยู่แล้ว" : "สร้างไม่สำเร็จ");
    }
  }

  return (
    <Modal title="เพิ่มเครื่องใหม่" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Machine ID (เช่น VM-022)">
          <input value={machineId} onChange={(e) => setMachineId(e.target.value)} required className="input" />
        </Field>
        <Field label="ชื่อเครื่อง (ไม่บังคับ)">
          <input
            value={machineName}
            onChange={(e) => setMachineName(e.target.value)}
            placeholder="เช่น ตู้คีบหน้าร้าน"
            className="input"
          />
        </Field>
        <Field label="สถานที่ตั้ง">
          <input value={location} onChange={(e) => setLocation(e.target.value)} className="input" />
        </Field>
        <Field label="ราคาต่อการเล่น (บาท)">
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} min={1} className="input" />
        </Field>
        {error && <p className="text-danger text-sm">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "กำลังสร้าง..." : "สร้างเครื่อง"}
        </button>
      </form>
    </Modal>
  );
}

function EditMachineModal({
  machine,
  onClose,
  onDone,
}: {
  machine: Machine;
  onClose: () => void;
  onDone: () => void;
}) {
  const [machineName, setMachineName] = useState(machine.machine_name ?? "");
  const [price, setPrice] = useState(machine.price);
  const [location, setLocation] = useState(machine.location ?? "");
  const [pulseMode, setPulseMode] = useState(machine.pulse_mode);
  const [keyStatus, setKeyStatus] = useState(machine.key_status);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch(`/api/machines/${machine.machine_id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        machine_name: machineName,
        price: Number(price),
        location,
        pulse_mode: pulseMode,
        key_status: keyStatus,
      }),
    });
    setLoading(false);
    onDone();
    onClose();
  }

  return (
    <Modal title={`แก้ไข ${machine.machine_id}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="ชื่อเครื่อง (ไม่บังคับ)">
          <input
            value={machineName}
            onChange={(e) => setMachineName(e.target.value)}
            placeholder="เช่น ตู้คีบหน้าร้าน"
            className="input"
          />
        </Field>
        <Field label="ราคาต่อการเล่น (บาท)">
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} min={1} className="input" />
        </Field>
        <Field label="สถานที่ตั้ง">
          <input value={location} onChange={(e) => setLocation(e.target.value)} className="input" />
        </Field>
        <Field label="Pulse mode (บาท:pulse)">
          <input value={pulseMode} onChange={(e) => setPulseMode(e.target.value)} className="input font-mono" />
        </Field>
        <Field label="สถานะ Key">
          <select value={keyStatus} onChange={(e) => setKeyStatus(e.target.value)} className="input">
            <option value="active">active</option>
            <option value="revoked">revoked (ปิดใช้งานเครื่องนี้)</option>
          </select>
        </Field>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "กำลังบันทึก..." : "บันทึก"}
        </button>
      </form>
    </Modal>
  );
}

function ApiKeyRevealModal({
  info,
  onClose,
}: {
  info: { machine_id: string; api_key: string };
  onClose: () => void;
}) {
  return (
    <Modal title={`API Key ของ ${info.machine_id}`} onClose={onClose}>
      <p className="text-danger text-sm mb-3">
        ⚠️ Copy เก็บไว้ตอนนี้เลย — ปิดหน้าต่างนี้แล้วจะไม่โชว์ค่านี้ให้เห็นอีก (ระบบเก็บแค่ hash ไว้ใน DB)
      </p>
      <div className="bg-panel2 border border-border rounded-lg p-3 font-mono text-xs text-white break-all select-all">
        {info.api_key}
      </div>
      <p className="text-muted text-xs mt-3">
        เอาค่านี้ไปใส่ใน <code>MACHINE_API_KEY</code> ของไฟล์ firmware แล้ว upload ขึ้นบอร์ด
      </p>
      <button onClick={onClose} className="btn-primary w-full mt-4">
        รับทราบ ปิดหน้าต่าง
      </button>
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
