"use client";

import { useMemo, useState } from "react";
import { LicenseStatus, setStoredLicenseStatus } from "../clientSession";

type Status = LicenseStatus;
type Role = "PSICOLOGO" | "SECRETARIA";
type User = { id: string; name: string; email: string; role: Role; blocked: boolean };
type Tenant = { id: string; name: string; owner: string; plan: string; status: Status; seats: number; users: User[] };

const initialTenants: Tenant[] = [
  { id: "t1", name: "Clínica Bem Viver", owner: "Dra. Mariana Costa", plan: "Starter", status: "TRIAL", seats: 3, users: [
    { id: "u1", name: "Dra. Mariana Costa", email: "mariana@bemviver.com", role: "PSICOLOGO", blocked: false },
    { id: "u2", name: "Camila Souza", email: "camila@bemviver.com", role: "SECRETARIA", blocked: false },
  ] },
  { id: "t2", name: "Consultório Equilíbrio", owner: "Dr. Rafael Lima", plan: "Professional", status: "ACTIVE", seats: 5, users: [
    { id: "u3", name: "Dr. Rafael Lima", email: "rafael@equilibrio.com", role: "PSICOLOGO", blocked: false },
    { id: "u4", name: "Juliana Martins", email: "juliana@equilibrio.com", role: "SECRETARIA", blocked: false },
  ] },
  { id: "t3", name: "Psico Norte", owner: "Dra. Helena Rocha", plan: "Demo", status: "DEMO", seats: 1, users: [
    { id: "u5", name: "Dra. Helena Rocha", email: "helena@psiconorte.com", role: "PSICOLOGO", blocked: false },
  ] },
];

const statusClass: Record<Status, string> = { DEMO: "badge badge-blue", TRIAL: "badge badge-yellow", ACTIVE: "badge badge-green", BLOCKED: "badge badge-red", CANCELED: "badge badge-red" };

export default function AjbAdminPage() {
  const [tenants, setTenants] = useState(initialTenants);
  const [selectedId, setSelectedId] = useState(initialTenants[0].id);
  const [search, setSearch] = useState("");
  const selected = tenants.find((tenant) => tenant.id === selectedId) || tenants[0];
  const filtered = tenants.filter((tenant) => `${tenant.name} ${tenant.owner}`.toLowerCase().includes(search.toLowerCase()));
  const stats = useMemo(() => ({ total: tenants.length, active: tenants.filter((t) => t.status === "ACTIVE").length, trial: tenants.filter((t) => t.status === "DEMO" || t.status === "TRIAL").length, blocked: tenants.filter((t) => t.status === "BLOCKED" || t.status === "CANCELED").length }), [tenants]);

  function setStatus(status: Status) {
    setTenants((current) => current.map((tenant) => tenant.id === selected.id ? { ...tenant, status } : tenant));
    setStoredLicenseStatus(status);
  }

  function toggleUser(userId: string) { setTenants((current) => current.map((tenant) => tenant.id !== selected.id ? tenant : { ...tenant, users: tenant.users.map((user) => user.id === userId ? { ...user, blocked: !user.blocked } : user) })); }

  return <main className="main-area"><header className="topbar"><div><p className="page-kicker">AJBNetSystems · SaaS Admin</p><h1 className="page-title">Admin AJBNetSystems</h1><p className="page-description">Painel interno para licenças, clientes e bloqueio de usuários do ClinicFlow Psico.</p></div><div className="top-actions"><a className="btn btn-secondary" href="/">Abrir produto</a></div></header><section className="grid stats-grid"><Stat label="Clientes" value={String(stats.total)} hint="Tenants" /><Stat label="Ativas" value={String(stats.active)} hint="ACTIVE" /><Stat label="Demo/Trial" value={String(stats.trial)} hint="Validação" /><Stat label="Bloqueadas" value={String(stats.blocked)} hint="Sem acesso" /></section><section className="grid two-column" style={{ marginTop: 18 }}><div className="card"><div className="card-header"><div><h2 className="card-title">Clientes SaaS</h2><p className="card-description">Controle de licença exclusivo da AJBNetSystems.</p></div></div><div className="field" style={{ marginBottom: 14 }}><input placeholder="Buscar cliente" value={search} onChange={(event) => setSearch(event.target.value)} /></div><div className="table-wrap"><table><thead><tr><th>Cliente</th><th>Licença</th><th>Plano</th><th>Ação</th></tr></thead><tbody>{filtered.map((tenant) => <tr key={tenant.id}><td>{tenant.name}<br /><small>{tenant.owner}</small></td><td><span className={statusClass[tenant.status]}>{tenant.status}</span></td><td>{tenant.plan}<br /><small>{tenant.seats} acessos</small></td><td><button className="btn btn-secondary" onClick={() => setSelectedId(tenant.id)}>Gerenciar</button></td></tr>)}</tbody></table></div></div><div className="card"><div className="card-header"><div><h2 className="card-title">Licença</h2><p className="card-description">BLOCKED/CANCELED bloqueia o cliente inteiro.</p></div></div><div className="appointment-list"><div className="appointment-item"><div className="time-box">SaaS</div><div><p className="item-title">{selected.name}</p><p className="item-meta">Responsável: {selected.owner}</p><p className="item-meta">Plano: {selected.plan} · Status: {selected.status}</p></div></div><div className="field"><label>Status da licença</label><select value={selected.status} onChange={(event) => setStatus(event.target.value as Status)}><option value="DEMO">Demo</option><option value="TRIAL">Trial</option><option value="ACTIVE">Active</option><option value="BLOCKED">Blocked</option><option value="CANCELED">Canceled</option></select></div><div className="empty-state">DEMO, TRIAL e ACTIVE liberam. BLOCKED e CANCELED bloqueiam geral no ambiente do cliente.</div></div></div></section><section className="card" style={{ marginTop: 18 }}><div className="card-header"><div><h2 className="card-title">Usuários do cliente</h2><p className="card-description">PSICOLOGO tem acesso clínico/financeiro. SECRETARIA apenas agenda e marcação.</p></div></div><div className="table-wrap"><table><thead><tr><th>Usuário</th><th>Role</th><th>Status</th><th>Permissão</th><th>Ação</th></tr></thead><tbody>{selected.users.map((user) => <tr key={user.id}><td>{user.name}<br /><small>{user.email}</small></td><td><span className="badge badge-blue">{user.role}</span></td><td><span className={user.blocked ? "badge badge-red" : "badge badge-green"}>{user.blocked ? "Bloqueado" : "Ativo"}</span></td><td>{user.role === "SECRETARIA" ? "Agenda sem faturamento/evolução" : "Clínico, documentos, relatórios e financeiro"}</td><td><button className="btn btn-secondary" onClick={() => toggleUser(user.id)}>{user.blocked ? "Desbloquear" : "Bloquear"}</button></td></tr>)}</tbody></table></div></section></main>;
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) { return <div className="card stat-card"><p className="stat-label">{label}</p><p className="stat-value">{value}</p><p className="stat-hint">{hint}</p></div>; }
