export type ClientRole = "PSICOLOGO" | "SECRETARIA";
export type LicenseStatus = "DEMO" | "TRIAL" | "ACTIVE" | "BLOCKED" | "CANCELED";

export const CLIENT_ROLE_STORAGE_KEY = "clinicflow-psico-client-role";
export const LICENSE_STATUS_STORAGE_KEY = "clinicflow-psico-license-status";

export const defaultClientRole: ClientRole = "PSICOLOGO";
export const defaultLicenseStatus: LicenseStatus = "ACTIVE";

export function getStoredClientRole(): ClientRole {
  if (typeof window === "undefined") return defaultClientRole;
  const value = window.localStorage.getItem(CLIENT_ROLE_STORAGE_KEY);
  return value === "SECRETARIA" ? "SECRETARIA" : "PSICOLOGO";
}

export function setStoredClientRole(role: ClientRole) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CLIENT_ROLE_STORAGE_KEY, role);
  window.dispatchEvent(new CustomEvent("clinicflow-role-change", { detail: role }));
}

export function getStoredLicenseStatus(): LicenseStatus {
  if (typeof window === "undefined") return defaultLicenseStatus;
  const value = window.localStorage.getItem(LICENSE_STATUS_STORAGE_KEY);
  if (value === "DEMO" || value === "TRIAL" || value === "ACTIVE" || value === "BLOCKED" || value === "CANCELED") return value;
  return defaultLicenseStatus;
}

export function setStoredLicenseStatus(status: LicenseStatus) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LICENSE_STATUS_STORAGE_KEY, status);
  window.dispatchEvent(new CustomEvent("clinicflow-license-change", { detail: status }));
}

export function isLicenseAllowed(status: LicenseStatus) {
  return status === "DEMO" || status === "TRIAL" || status === "ACTIVE";
}
