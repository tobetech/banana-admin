import crypto from "crypto";

const SECRET = process.env.SESSION_SECRET || "";
const SESSION_MAX_AGE_MS = 12 * 60 * 60 * 1000; // 12 ชั่วโมง

export const SESSION_COOKIE_NAME = "vendshop_session";

export type AdminRole = "admin" | "super_admin";
type SessionPayload = { username: string; role: AdminRole; issuedAt: number };

export function createSessionToken(username: string, role: AdminRole): string {
  if (!SECRET) throw new Error("Missing SESSION_SECRET environment variable");
  const payload: SessionPayload = { username, role, issuedAt: Date.now() };
  const b64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET).update(b64).digest("base64url");
  return `${b64}.${sig}`;
}

export function verifySessionToken(token: string | undefined | null): SessionPayload | null {
  if (!token || !SECRET) return null;
  const [b64, sig] = token.split(".");
  if (!b64 || !sig) return null;

  const expectedSig = crypto.createHmac("sha256", SECRET).update(b64).digest("base64url");
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(b64, "base64url").toString()) as SessionPayload;
    if (Date.now() - payload.issuedAt > SESSION_MAX_AGE_MS) return null;
    return payload;
  } catch {
    return null;
  }
}
