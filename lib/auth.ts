import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE_NAME, verifySessionToken } from "./session";

export function requireAuth() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(token);
  if (!session) redirect("/login");
  return session;
}

export function requireSuperAdmin() {
  const session = requireAuth();
  if (session.role !== "super_admin") redirect("/dashboard");
  return session;
}

export function getSession() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}
