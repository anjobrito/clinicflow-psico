"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AccessDenied from "../AccessDenied";
import { can } from "../accessControl";
import { AuditEntry, clearAuditEntries, loadAuditEntries } from "../audit";
import { ClientRole, getStoredClientRole } from "../clientSession";

export default function AuditPage() {
  const [role, setRole] = useState<ClientRole>("PSICOLOGO");
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [scope, setScope] = useState<"TODOS" | "CLINIC" | "AJB">("TODOS");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setRole(getStoredClientRole());
    setEntries(loadAuditEntries());
    const refresh = () => setEntries(loadAuditEntries());
    window.addEventListener("clinicflow-audit-change", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("clinicflow-audit-change", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return entries.filter((entry) => {
      const scopeMatches = scope === "TODOS" || entry.scope === scope;
      const textMatches = `${entry.action} ${entry.actor} ${entry.targetType} ${entry.description}`.toLowerCase().includes(term);
      return scopeMatches && textMatches;
    });
  }, [entries, scope, search]);

  const stats = useMemo(() => ({
    total: entries.length,
    clinic: entries.filter((entry) => entry.scope === "CLINIC").length,
    ajb: entries.filter((entry) => entry.scope === "AJB").length,
    today: entries.filter((entry) => new Date(entry.createdAt).toDateString() === new Date().toDateString()).length,
  }), [entries]);

  function clearHistory() {
    if (!window.confirm("Deseja apagar o histórico local de auditoria desta demonstração?")) return;
    clearAuditEntries();
    setEntries([]);
  }

  if (!can(role, "patients:read-full")) {
    return <AccessDenied message="Seu perfil de secretária não possui acesso ao histórico de auditoria do consultório." />;
  }

  return (
    <main className="main-area">
      <header className="topbar">
        <div>
          <p className="page-kicker">ClinicFlow Psico · Segurança</p>
          <h1 className="page-title">Auditoria</h1>
          <p className="page-description">Histórico de alterações administrativas do consultório e de ações executadas pela AJBNetSystems.</p>
        </div>
        <div className="top-actions"><Link className="btn btn-secondary" href="/usuarios">Usuários</Link><Link className="btn btn-secondary" href="/">Voltar ao painel</Link><button className="btn btn-secondary" onClick={clearHistory}>Limpar demonstração</button></div>
      </header>

      <section className="grid stats-grid">
        <Stat label="Eventos" value={String(stats.total)} hint="Histórico total" />
        <Stat label="Consultório" value={String(stats.clinic)} hint="Ações internas" />
        <Stat label="AJBNetSystems" value={String(stats.ajb)} hint="Licenças e bloqueios" />
        <Stat label="Hoje" value={String(stats.today)} hint="Eventos do dia" />
      </section>

      <section className="card" style={{ marginTop: 18 }}>
        <div className="card-header"><div><h2 className="card-title">Filtros</h2><p className="card-description">Localize ações por origem, usuário, alvo ou descrição.</p></div></div>
        <div className="form-grid">
          <Field label="Origem"><select value={scope} onChange={(event) => setScope(event.target.value as "TODOS" | "CLINIC" | "AJB")}><option value="TODOS">Todos</option><option value="CLINIC">Consultório</option><option value="AJB">AJBNetSystems</option></select></Field>
          <Field label="Busca"><input placeholder="Ex.: bloqueado, licença, role" value={search} onChange={(event) => setSearch(event.target.value)} /></Field>
        </div>
      </section>

      <section className="card" style={{ marginTop: 18 }}>
        <div className="card-header"><div><h2 className="card-title">Histórico de eventos</h2><p className="card-description">Os eventos atuais são armazenados localmente até a migração para PostgreSQL.</p></div></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Data/Hora</th><th>Origem</th><th>Ação</th><th>Responsável</th><th>Alvo</th><th>Descrição</th></tr></thead>
            <tbody>{filtered.length === 0 ? <tr><td colSpan={6}>Nenhum evento de auditoria encontrado.</td></tr> : filtered.map((entry) => <tr key={entry.id}><td>{new Date(entry.createdAt).toLocaleString("pt-BR")}</td><td><span className={entry.scope === "AJB" ? "badge badge-blue" : "badge badge-green"}>{entry.scope === "AJB" ? "AJBNetSystems" : "Consultório"}</span></td><td>{entry.action}</td><td>{entry.actor}</td><td>{entry.targetType}{entry.targetId ? ` · ${entry.targetId}` : ""}</td><td>{entry.description}</td></tr>)}</tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="field"><label>{label}</label>{children}</div>; }
function Stat({ label, value, hint }: { label: string; value: string; hint: string }) { return <div className="card stat-card"><p className="stat-label">{label}</p><p className="stat-value">{value}</p><p className="stat-hint">{hint}</p></div>; }
