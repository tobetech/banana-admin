import { pool } from "./db";

export async function logAdminAction(
  username: string,
  action: string,
  detail: Record<string, unknown> = {},
  ipAddress?: string | null
) {
  try {
    await pool.query(
      `insert into vending.admin_logs (username, action, detail, ip_address) values ($1, $2, $3, $4)`,
      [username, action, JSON.stringify(detail), ipAddress ?? null]
    );
  } catch (e) {
    // ไม่ให้ log พังแล้วทำให้ action หลักล้มเหลวไปด้วย แค่ print ไว้เฉยๆ
    console.error("Failed to write admin log:", e);
  }
}

export function getClientIp(req: Request): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return null;
}
