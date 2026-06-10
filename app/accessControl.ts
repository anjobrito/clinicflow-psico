export type ClientRole = "PSICOLOGO" | "SECRETARIA";

export type ClientPermission =
  | "agenda:read"
  | "agenda:write"
  | "patients:read-basic"
  | "patients:read-full"
  | "clinical-notes:read"
  | "clinical-notes:write"
  | "documents:read"
  | "documents:write"
  | "finance:read"
  | "finance:write"
  | "reports:read";

export const rolePermissions: Record<ClientRole, ClientPermission[]> = {
  PSICOLOGO: [
    "agenda:read",
    "agenda:write",
    "patients:read-basic",
    "patients:read-full",
    "clinical-notes:read",
    "clinical-notes:write",
    "documents:read",
    "documents:write",
    "finance:read",
    "finance:write",
    "reports:read",
  ],
  SECRETARIA: [
    "agenda:read",
    "agenda:write",
    "patients:read-basic",
  ],
};

export function can(role: ClientRole, permission: ClientPermission) {
  return rolePermissions[role].includes(permission);
}

export function getDeniedMessage(permission: ClientPermission) {
  if (permission.startsWith("finance")) return "Seu perfil não possui acesso ao faturamento.";
  if (permission.startsWith("clinical-notes")) return "Seu perfil não possui acesso à evolução clínica.";
  if (permission.startsWith("documents")) return "Seu perfil não possui acesso aos documentos psicológicos.";
  if (permission.startsWith("reports")) return "Seu perfil não possui acesso aos relatórios.";
  return "Seu perfil não possui acesso a esta funcionalidade.";
}
