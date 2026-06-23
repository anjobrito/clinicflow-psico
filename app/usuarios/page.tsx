"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import AccessDenied from "../AccessDenied";
import { can } from "../accessControl";
import { appendAuditEntry } from "../audit";
import { ClientRole, getStoredClientRole } from "../clientSession";

type ClinicUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: ClientRole;
  active: boolean;
  blocked: boolean;
  createdAt: string;
};

const storageKey = "clinicflow-psico-users-v1";

const initialUsers: ClinicUser[] = [
  { id: "user-psychologist-1", name: "Dra. Ana Psicóloga", email: "ana@clinicflow.com.br", phone: "(19) 99999-0001", role: "PSICOLOGO", active: true, blocked: false, createdAt: new Date().toISOString() },
  { id: "user-secretary-1", name: "Marina Secretária", email: "marina@clinicflow.com.br", phone: "(19) 99999-0002", role: "SECRETARIA", active: true, blocked: false, createdAt: new Date().toISOString() },
];

function loadUsers() {
  if (typeof window === "undefined") return initialUsers;
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return initialUsers;
  try {
    const parsed = JSON.parse(raw) as ClinicUser[];
    return Array.isArray(parsed) ? parsed : initialUsers;
  } catch {
    return initialUsers;
  }
}

export default function UsersPage() {
  const [currentRole, setCurrentRole] = useState<ClientRole>("PSICOLOGO");
  const [users, setUsers] = useState<ClinicUser[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", role: "SECRETARIA" as ClientRole });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setCurrentRole(getStoredClientRole());
    setUsers(loadUsers());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded || typeof window === "undefined") return;
    window.localStorage.setItem(storageKey, JSON.stringify(users));
  }, [loaded, users]);

  const filteredUsers = useMemo(() => {
    const term = search.toLowerCase();
    return users.filter((user) => `${user.name} ${user.email} ${user.phone} ${user.role}`.toLowerCase().includes(term));
  }, [search, users]);

  const totals = useMemo(() => ({
    total: users.length,
    psychologists: users.filter((user) => user.role === "PSICOLOGO").length,
    secretaries: users.filter((user) => user.role === "SECRETARIA").length,
    blocked: users.filter((user) => user.blocked || !user.active).length,
  }), [users]);

  function createUser(event: FormEvent) {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return alert("Informe nome e e-mail.");
    if (users.some((user) => user.email.toLowerCase() === form.email.trim().toLowerCase())) return alert("Já existe um usuário com este e-mail.");

    const newUser: ClinicUser = {
      id: `user-${Date.now()}`,
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      role: form.role,
      active: true,
      blocked: false,
      createdAt: new Date().toISOString(),
    };

    setUsers((current) => [newUser, ...current]);
    appendAuditEntry({ scope: "CLINIC", action: "USER_CREATED", actor: "Psicólogo responsável", targetType: "USER", targetId: newUser.id, description: `Usuário ${newUser.name} criado com a role ${newUser.role}.` });
    setForm({ name: "", email: "", phone: "", role: "SECRETARIA" });
  }

  function toggleActive(id: string) {
    const user = users.find((item) => item.id === id);
    if (!user) return;
    const nextActive = !user.active;
    setUsers((current) => current.map((item) => item.id === id ? { ...item, active: nextActive } : item));
    appendAuditEntry({ scope: "CLINIC", action: nextActive ? "USER_ACTIVATED" : "USER_DEACTIVATED", actor: "Psicólogo responsável", targetType: "USER", targetId: id, description: `${user.name} foi ${nextActive ? "ativado" : "desativado"}.` });
  }

  function toggleBlocked(id: string) {
    const user = users.find((item) => item.id === id);
    if (!user) return;
    const nextBlocked = !user.blocked;
    setUsers((current) => current.map((item) => item.id === id ? { ...item, blocked: nextBlocked } : item));
    appendAuditEntry({ scope: "CLINIC", action: nextBlocked ? "USER_BLOCKED" : "USER_UNBLOCKED", actor: "Psicólogo responsável", targetType: "USER", targetId: id, description: `${user.name} foi ${nextBlocked ? "bloqueado" : "desbloqueado"}.` });
  }

  function changeRole(id: string, role: ClientRole) {
    const user = users.find((item) => item.id === id);
    if (!user || user.role === role) return;
    setUsers((current) => current.map((item) => item.id === id ? { ...item, role } : item));
    appendAuditEntry({ scope: "CLINIC", action: "USER_ROLE_CHANGED", actor: "Psicólogo responsável", targetType: "USER", targetId: id, description: `Role de ${user.name} alterada de ${user.role} para ${role}.` });
  }

  if (!can(currentRole, "patients:read-full")) {
    return <AccessDenied message="Seu perfil de secretária não possui permissão para cadastrar, alterar ou bloquear usuários do consultório." />;
  }

  return (
    <main className="main-area">
      <header className="topbar">
        <div>
          <p className="page-kicker">ClinicFlow Psico · Usuários</p>
          <h1 className="page-title">Usuários do consultório</h1>
          <p className="page-description">Cadastre psicólogos e secretárias, defina roles e controle o acesso de cada usuário.</p>
        </div>
        <div className="top-actions"><Link className="btn btn-secondary" href="/auditoria">Ver auditoria</Link><Link className="btn btn-secondary" href="/">Voltar ao painel</Link></div>
      </header>

      <section className="grid stats-grid">
        <Stat label="Usuários" value={String(totals.total)} hint="Total cadastrado" />
        <Stat label="Psicólogos" value={String(totals.psychologists)} hint="Acesso clínico completo" />
        <Stat label="Secretárias" value={String(totals.secretaries)} hint="Agenda e marcação" />
        <Stat label="Restritos" value={String(totals.blocked)} hint="Inativos ou bloqueados" />
      </section>

      <section className="grid two-column" style={{ marginTop: 18 }}>
        <div className="card">
          <div className="card-header"><div><h2 className="card-title">Novo usuário</h2><p className="card-description">Somente as roles de Psicólogo e Secretária são aceitas nesta versão.</p></div></div>
          <form className="form-grid" onSubmit={createUser}>
            <Field label="Nome"><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field>
            <Field label="E-mail"><input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></Field>
            <Field label="Telefone"><input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></Field>
            <Field label="Role"><select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as ClientRole })}><option value="PSICOLOGO">Psicólogo</option><option value="SECRETARIA">Secretária</option></select></Field>
            <div className="field full"><button className="btn btn-primary">Cadastrar usuário</button></div>
          </form>
        </div>

        <div className="card">
          <div className="card-header"><div><h2 className="card-title">Regras de acesso</h2><p className="card-description">Resumo das permissões aplicadas atualmente.</p></div></div>
          <div className="appointment-list">
            <div className="appointment-item"><div className="time-box">PSI</div><div><p className="item-title">Psicólogo</p><p className="item-meta">Agenda, pacientes completos, atendimento, documentos, relatórios e financeiro.</p></div></div>
            <div className="appointment-item"><div className="time-box">SEC</div><div><p className="item-title">Secretária</p><p className="item-meta">Agenda, marcação e dados básicos. Sem financeiro, documentos e evolução clínica.</p></div></div>
          </div>
        </div>
      </section>

      <section className="card" style={{ marginTop: 18 }}>
        <div className="card-header"><div><h2 className="card-title">Usuários cadastrados</h2><p className="card-description">Ative, desative, bloqueie ou altere a role dos usuários.</p></div></div>
        <div className="field" style={{ marginBottom: 14 }}><input placeholder="Buscar por nome, e-mail, telefone ou role" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Usuário</th><th>Role</th><th>Status</th><th>Permissões</th><th>Ações</th></tr></thead>
            <tbody>{filteredUsers.map((user) => (
              <tr key={user.id}>
                <td>{user.name}<br /><small>{user.email} · {user.phone || "Sem telefone"}</small></td>
                <td><select value={user.role} onChange={(event) => changeRole(user.id, event.target.value as ClientRole)}><option value="PSICOLOGO">Psicólogo</option><option value="SECRETARIA">Secretária</option></select></td>
                <td><span className={user.blocked || !user.active ? "badge badge-red" : "badge badge-green"}>{user.blocked ? "Bloqueado" : user.active ? "Ativo" : "Inativo"}</span></td>
                <td>{user.role === "SECRETARIA" ? "Agenda e marcação" : "Acesso clínico e financeiro"}</td>
                <td><div className="top-actions"><button className="btn btn-secondary" onClick={() => toggleActive(user.id)}>{user.active ? "Desativar" : "Ativar"}</button><button className="btn btn-secondary" onClick={() => toggleBlocked(user.id)}>{user.blocked ? "Desbloquear" : "Bloquear"}</button></div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="field"><label>{label}</label>{children}</div>; }
function Stat({ label, value, hint }: { label: string; value: string; hint: string }) { return <div className="card stat-card"><p className="stat-label">{label}</p><p className="stat-value">{value}</p><p className="stat-hint">{hint}</p></div>; }
