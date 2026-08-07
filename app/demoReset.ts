export type DemoStorageKey = {
  key: string;
  label: string;
  description: string;
};

export const demoStorageKeys: DemoStorageKey[] = [
  { key: "clinicflow-psico-mvp-state-v1", label: "Agenda, pacientes e evoluções", description: "Remove pacientes, consultas e evoluções salvos localmente." },
  { key: "clinicflow-psico-payments-v1", label: "Financeiro", description: "Remove baixas, métodos de pagamento e cobranças demonstrativas." },
  { key: "clinicflow-psico-documents-v1", label: "Documentos psicológicos", description: "Remove rascunhos, documentos em revisão e documentos emitidos na demonstração." },
  { key: "clinicflow-psico-users-v1", label: "Usuários do consultório", description: "Remove usuários, bloqueios, roles e status locais do consultório." },
  { key: "clinicflow-psico-audit-v1", label: "Auditoria", description: "Remove o histórico local de auditoria." },
  { key: "clinicflow-psico-clinics-v1", label: "Consultórios", description: "Remove unidades e consultórios cadastrados localmente." },
  { key: "clinicflow-psico-active-clinic-v1", label: "Unidade ativa", description: "Remove o consultório ativo selecionado." },
  { key: "clinicflow-psico-client-role", label: "Perfil demonstrativo", description: "Remove o perfil PSICOLOGO/SECRETARIA selecionado." },
  { key: "clinicflow-psico-license-status", label: "Licença demonstrativa", description: "Remove bloqueios locais de licença e volta ao padrão ACTIVE." },
];

export function resetDemoEnvironment() {
  if (typeof window === "undefined") return 0;

  demoStorageKeys.forEach((item) => window.localStorage.removeItem(item.key));
  window.dispatchEvent(new CustomEvent("clinicflow-license-change"));
  window.dispatchEvent(new CustomEvent("clinicflow-clinics-change"));
  window.dispatchEvent(new CustomEvent("clinicflow-active-clinic-change"));
  window.dispatchEvent(new CustomEvent("clinicflow-audit-change"));

  return demoStorageKeys.length;
}
