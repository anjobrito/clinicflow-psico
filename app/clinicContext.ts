export type ClinicUnit = {
  id: string;
  name: string;
  document: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  active: boolean;
  createdAt: string;
};

export const CLINICS_STORAGE_KEY = "clinicflow-psico-clinics-v1";
export const ACTIVE_CLINIC_STORAGE_KEY = "clinicflow-psico-active-clinic-v1";

export const initialClinics: ClinicUnit[] = [
  {
    id: "clinic-main",
    name: "Clínica Principal",
    document: "",
    phone: "",
    email: "",
    address: "",
    city: "Campinas",
    state: "SP",
    active: true,
    createdAt: new Date().toISOString(),
  },
];

export function loadClinics(): ClinicUnit[] {
  if (typeof window === "undefined") return initialClinics;
  const raw = window.localStorage.getItem(CLINICS_STORAGE_KEY);
  if (!raw) return initialClinics;
  try {
    const parsed = JSON.parse(raw) as ClinicUnit[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : initialClinics;
  } catch {
    return initialClinics;
  }
}

export function saveClinics(clinics: ClinicUnit[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CLINICS_STORAGE_KEY, JSON.stringify(clinics));
  window.dispatchEvent(new CustomEvent("clinicflow-clinics-change"));
}

export function getActiveClinicId(): string {
  if (typeof window === "undefined") return initialClinics[0].id;
  const clinics = loadClinics();
  const stored = window.localStorage.getItem(ACTIVE_CLINIC_STORAGE_KEY);
  if (stored && clinics.some((clinic) => clinic.id === stored && clinic.active)) return stored;
  return clinics.find((clinic) => clinic.active)?.id || clinics[0].id;
}

export function setActiveClinicId(clinicId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACTIVE_CLINIC_STORAGE_KEY, clinicId);
  window.dispatchEvent(new CustomEvent("clinicflow-active-clinic-change", { detail: clinicId }));
}

export function getActiveClinic(): ClinicUnit {
  const clinics = loadClinics();
  const activeId = getActiveClinicId();
  return clinics.find((clinic) => clinic.id === activeId) || clinics[0];
}
