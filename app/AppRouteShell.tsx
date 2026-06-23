"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import AccessDenied from "./AccessDenied";
import SidebarProductLinks from "./SidebarProductLinks";
import { ClientRole, LicenseStatus, getStoredClientRole, getStoredLicenseStatus, isLicenseAllowed, setStoredClientRole } from "./clientSession";

const navigation = [
  { href: "/", label: "Dashboard", icon: "◎" },
  { href: "/", label: "Agenda", icon: "◷" },
  { href: "/", label: "Pacientes", icon: "◉" },
  { href: "/", label: "Atendimento", icon: "✎" },
  { href: "/documentos", label: "Documentos", icon: "□" },
  { href: "/relatorios", label: "Relatórios", icon: "▤" },
  { href: "/financeiro", label: "Financeiro", icon: "◈" },
  { href: "/", label: "Configurações", icon: "⚙" },
];

export default function AppRouteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [role, setRole] = useState<ClientRole>("PSICOLOGO");
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus>("ACTIVE");

  useEffect(() => {
    setRole(getStoredClientRole());
    setLicenseStatus(getStoredLicenseStatus());

    const updateLicense = () => setLicenseStatus(getStoredLicenseStatus());
    window.addEventListener("clinicflow-license-change", updateLicense);
    window.addEventListener("storage", updateLicense);
    return () => {
      window.removeEventListener("clinicflow-license-change", updateLicense);
      window.removeEventListener("storage", updateLicense);
    };
  }, []);

  function changeRole(nextRole: ClientRole) {
    setRole(nextRole);
    setStoredClientRole(nextRole);
  }

  if (pathname.startsWith("/ajb-admin")) {
    return <>{children}</>;
  }

  if (!isLicenseAllowed(licenseStatus)) {
    return <AccessDenied title="Licença bloqueada" message="A licença deste consultório está bloqueada ou cancelada pela AJBNetSystems. O acesso ao ambiente do cliente foi interrompido até a regularização." actionHref="/ajb-admin" actionLabel="Abrir AJB Admin" />;
  }

  if (pathname === "/") {
    return (
      <>
        <SidebarProductLinks />
        {children}
      </>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">CP</div>
          <div>
            <h1 className="brand-title">ClinicFlow Psico</h1>
            <p className="brand-subtitle">Gestão para psicólogos</p>
          </div>
        </div>

        <nav className="nav-list">
          {navigation.map((item) => {
            const isActive = item.href !== "/" && pathname.startsWith(item.href);
            return (
              <a key={`${item.label}-${item.href}`} className={`nav-button sidebar-direct-link ${isActive ? "active" : ""}`} href={item.href}>
                <span className="nav-label"><span>{item.icon}</span>{item.label}</span>
                <span>›</span>
              </a>
            );
          })}
        </nav>

        <div className="sidebar-card">
          <strong>Perfil demonstrativo</strong>
          <p>Licença: {licenseStatus}. Simule as permissões do ambiente do cliente antes do login real.</p>
          <select value={role} onChange={(event) => changeRole(event.target.value as ClientRole)}>
            <option value="PSICOLOGO">Psicólogo</option>
            <option value="SECRETARIA">Secretária</option>
          </select>
          <a className="btn btn-primary" href="/">Voltar ao painel</a>
        </div>
      </aside>

      {children}
    </div>
  );
}
