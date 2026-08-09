"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setError("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
      }
    } catch {
      setError("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">Banana Land</h1>
          <p className="text-muted text-sm mt-1">เข้าสู่ระบบหลังบ้าน</p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="bg-panel border border-border rounded-2xl p-6 space-y-4"
        >
          <div>
            <label className="block text-sm text-muted mb-1.5">ชื่อผู้ใช้</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-panel2 border border-border rounded-lg px-3 py-2.5 text-white outline-none focus:border-accent"
              autoFocus
              required
            />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1.5">รหัสผ่าน</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-panel2 border border-border rounded-lg px-3 py-2.5 text-white outline-none focus:border-accent"
              required
            />
          </div>
          {error && <p className="text-danger text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent hover:bg-accent-dark disabled:opacity-50 text-gray-900 font-medium rounded-lg py-2.5 transition"
          >
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>
      </div>
    </div>
  );
}
