/* Lightweight mock authentication — prototype only. */
import type { Role } from "@/data/mockData";

export type AuthFailure = "invalid" | "disabled" | "network";
export type AuthResult = { ok: true; name: string; email: string; role: Role } | { ok: false; error: AuthFailure };

export const DEMO_ACCOUNTS: { email: string; password: string; label: string; role: Role; outcome: string }[] = [
  { email: "ops@spgcargo.com", password: "CargoOS@2026", label: "Operations · Rhea Kulkarni", role: "operations", outcome: "Operations view" },
  { email: "mgmt@spgcargo.com", password: "CargoOS@2026", label: "Management · Vikram Nair", role: "management", outcome: "Management view" },
  { email: "sales@spgcargo.com", password: "CargoOS@2026", label: "Sales · Arjun Sharma", role: "sales", outcome: "Sales view" },
  { email: "finance@spgcargo.com", password: "CargoOS@2026", label: "Finance · Meera Iyer", role: "finance", outcome: "Finance view" },
  { email: "logistics@apexcomponents.com", password: "CargoOS@2026", label: "Customer · Apex Components", role: "customer", outcome: "Customer view" },
  { email: "ops@deccanroadways.com", password: "CargoOS@2026", label: "Vendor · Deccan Roadways", role: "vendor", outcome: "Vendor view" },
  { email: "disabled@spgcargo.com", password: "CargoOS@2026", label: "Disabled account", role: "operations", outcome: "Access blocked" },
  { email: "offline@spgcargo.com", password: "CargoOS@2026", label: "Network failure", role: "operations", outcome: "Connection error" },
];

const SESSION_KEY = "cargoos.session";
const ROLE_KEY = "cargoos.role";
const REMEMBER_KEY = "cargoos.remember";

export async function mockSignIn(email: string, password: string): Promise<AuthResult> {
  await new Promise((r) => setTimeout(r, 1250));
  const e = email.trim().toLowerCase();
  if (e === "offline@spgcargo.com") return { ok: false, error: "network" };
  if (e === "disabled@spgcargo.com") return { ok: false, error: "disabled" };
  const acct = DEMO_ACCOUNTS.find((a) => a.email === e);
  if (acct && password === "CargoOS@2026") {
    const role = acct.role;
    const name = role === "customer" ? "Apex Components" : role === "vendor" ? "Deccan Roadways" : "Rhea Kulkarni";
    return { ok: true, name, email: e, role };
  }
  return { ok: false, error: "invalid" };
}

export function saveSession(name: string, email: string, role: Role) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ name, email, role, at: Date.now() }));
    localStorage.setItem(ROLE_KEY, role);
  } catch { /* noop */ }
}
export function getSession(): { name: string; email: string; role: Role } | null {
  try {
    const v = sessionStorage.getItem(SESSION_KEY);
    return v ? JSON.parse(v) : null;
  } catch { return null; }
}
export function getStoredRole(): Role | null {
  try { return (localStorage.getItem(ROLE_KEY) as Role) ?? null; } catch { return null; }
}
export function clearSession() {
  try { sessionStorage.removeItem(SESSION_KEY); localStorage.removeItem(ROLE_KEY); } catch { /* noop */ }
}
export function getRemembered(): string {
  try { return localStorage.getItem(REMEMBER_KEY) ?? ""; } catch { return ""; }
}
export function setRemembered(email: string | null) {
  try { email ? localStorage.setItem(REMEMBER_KEY, email) : localStorage.removeItem(REMEMBER_KEY); } catch { /* noop */ }
}
