"use client";

import { usePathname } from "next/navigation";
import SidebarProductLinks from "./SidebarProductLinks";

const navigation = [
  { href: "/", label: "Dashboard", icon: "◎" },
  { href: "/", label: "Agenda", icon: "◷" },
  { href: "/", label: "Pacientes", icon: "◉" },
  { href: "/", label: "Atendimento", icon: "✎" },
  { href: "/relatorios", label: "Relatórios", icon: "▤" },
  { href: "/financeiro", label: "Financeiro", icon: "◈" },
  { href: "/", label: "Configurações", icon: "⚙" },
];

export default function AppRouteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname.startsWith("/ajb-admin")) {
    return <>{children}</>;
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
          <strong>Navegação do produto</strong>
          <p>Volte ao painel para operar agenda, pacientes e atendimentos. Relatórios e financeiro ficam em páginas dedicadas.</p>
          <a className="btn btn-primary" href="/">Voltar ao painel</a>
        </div>
      </aside>

      {children}
    </div>
  );
}
