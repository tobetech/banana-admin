import { Pool } from "pg";

// ต่อ Postgres ตรง (ไม่ผ่าน PostgREST/RLS) เหมือนแพทเทิร์นที่ใช้ใน Edge Functions
// VENDING_DB_URL ต้องเป็น server-only env var ห้าม expose ไปฝั่ง client เด็ดขาด
declare global {
  // eslint-disable-next-line no-var
  var _vendshopPgPool: Pool | undefined;
}

function createPool() {
  if (!process.env.VENDING_DB_URL) {
    throw new Error("Missing VENDING_DB_URL environment variable");
  }
  return new Pool({
    connectionString: process.env.VENDING_DB_URL,
    ssl: { rejectUnauthorized: false },
    max: 5,
  });
}

export const pool = global._vendshopPgPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  global._vendshopPgPool = pool;
}

export async function query<T = any>(text: string, params: any[] = []): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}

export async function queryOne<T = any>(text: string, params: any[] = []): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}
