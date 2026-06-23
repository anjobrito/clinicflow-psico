export type AuditScope = "CLINIC" | "AJB";

export type AuditEntry = {
  id: string;
  scope: AuditScope;
  action: string;
  actor: string;
  targetType: string;
  targetId?: string;
  description: string;
  createdAt: string;
};

export const AUDIT_STORAGE_KEY = "clinicflow-psico-audit-v1";

export function loadAuditEntries(): AuditEntry[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(AUDIT_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as AuditEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function appendAuditEntry(entry: Omit<AuditEntry, "id" | "createdAt">) {
  if (typeof window === "undefined") return;
  const current = loadAuditEntries();
  const next: AuditEntry = {
    ...entry,
    id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    createdAt: new Date().toISOString(),
  };
  window.localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify([next, ...current].slice(0, 500)));
  window.dispatchEvent(new CustomEvent("clinicflow-audit-change", { detail: next }));
}

export function clearAuditEntries() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUDIT_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("clinicflow-audit-change"));
}
