"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import AccessDenied from "../AccessDenied";
import { can } from "../accessControl";
import { appendAuditEntry } from "../audit";
import { ClientRole, getStoredClientRole } from "../clientSession";
import { ClinicUnit, getActiveClinicId, initialClinics, loadClinics, saveClinics, setActiveClinicId } from "../clinicContext";

export default function ClinicsPage() {
  const [role, setRole] = useState<ClientRole>("PSICOLOGO");
  const [clinics, setClinics] = useState<ClinicUnit[]>(initialClinics);
  const [activeClinicId, setActiveClinic] = useState(initialClinics[0].id);
  const [search, setSearch] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState({ name: "", document: "", phone: "", email: "", address: "", city: "Campinas", state: "SP" });

  useEffect(() => {
    const loadedClinics = loadClinics();
    setRole(getStoredClientRole());
    setClinics(loadedClinics);
    setActiveClinic(getActiveClinicId());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    saveClinics(clinics);
  }, [clinics, loaded]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return clinics.filter((clinic) => `${clinic.name} ${clinic.document} ${clinic.city} ${clinic.state}`.toLowerCase().includes(term));
  }, [clinics, search]);

  const totals = useMemo(() => ({
    total: clinics.length,
    active: clinics.filter((clinic) => clinic.active).length,
    inactive: clinics.filter((clinic) => !clinic.active).length,
    cities: new Set(clinics.map((clinic) => `${clinic.city}-${clinic.state}`)).size,
  }), [clinics]);

  function createClinic(event: FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) return alert("Informe o nome do consultório.");

    const clinic: ClinicUnit = {
      id: `clinic-${Date.now()}`,
      name: form.name.trim(),
      document: form.document.trim(),
      phone: form.phone.trim(),
      email: form.email.trim().toLowerCase(),
      address: form.address.trim(),
      city: form.city.trim(),
      state: form.state,
      active: true,
      createdAt: new Date().toISOString(),
    };

    setClinics((current) => [clinic, ...current]);
    appendAuditEntry({ scope: "CLINIC", action: "CLINIC_CREATED", actor: "Psicólogo responsável", targetType: "CLINIC", targetId: clinic.id, description: `Consultório ${clinic.name} criado em ${clinic.city}/${clinic.state}.` });
    setForm({ name: "", document: "", phone: "", email: "", address: "", city: "Campinas", state: "SP" });
  }

  function toggleClinic(id: string) {
    const clinic = clinics.find((item) => item.id === id);
    if (!clinic) return;
    const nextActive = !clinic.active;
    setClinics((current) => current.map((item) => item.id === id ? { ...item, active: nextActive } : item));
    appendAuditEntry({ scope: "CLINIC", action: nextActive ? "CLINIC_ACTIVATED" : "CLINIC_DEACTIVATED", actor: "Psicólogo responsável", targetType: "CLINIC", targetId: id, description: `${clinic.name} foi ${nextActive ? "ativado" : "desativado"}.` });

    if (!nextActive && activeClinicId === id) {
      const replacement = clinics.find((item) => item.id !== id && item.active);
      if (replacement) {
        setActiveClinic(replacement.id);
        setActiveClinicId(replacement.id);
      }
    }
  }

  function selectClinic(id: string) {
    setActiveClinic(id);
    setActiveClinicId(id);
    const clinic = clinics.find((item) => item.id === id);
    if (clinic) appendAuditEntry({ scope: "CLINIC", action: "ACTIVE_CLINIC_CHANGED", actor: "Usuário atual", targetType: "CLINIC", targetId: id, description: `${clinic.name} definido como consultório ativo.` });
  }

  if (!can(role, "patients:read-full")) {
    return <AccessDenied message="Seu perfil de secretária não possui permissão para cadastrar ou desativar consultórios." />;
  }

  return (
    <main className="main-area">
      <header className="topbar">
        <div>
          <p className="page-kicker">ClinicFlow Psico · Multi-consultório</p>
          <h1 className="page-title">Consultórios e unidades</h1>
          <p className="page-description">Cadastre unidades do mesmo cliente SaaS e defina qual consultório está ativo na operação.</p>
        </div>
        <div className="top-actions"><Link className="btn btn-secondary" href="/auditoria">Auditoria</Link><Link className="btn btn-secondary" href="/">Voltar ao painel</Link></div>
      </header>

      <section className="grid stats-grid">
        <Stat label="Unidades" value={String(totals.total)} hint="Total cadastrado" />
        <Stat label="Ativas" value={String(totals.active)} hint="Disponíveis para operação" />
        <Stat label="Inativas" value={String(totals.inactive)} hint="Fora de operação" />
        <Stat label="Cidades" value={String(totals.cities)} hint="Cobertura atual" />
      </section>

      <section className="grid two-column" style={{ marginTop: 18 }}>
        <div className="card">
          <div className="card-header"><div><h2 className="card-title">Nova unidade</h2><p className="card-description">Cadastre um consultório vinculado ao mesmo cliente SaaS.</p></div></div>
          <form className="form-grid" onSubmit={createClinic}>
            <Field label="Nome"><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field>
            <Field label="Documento"><input value={form.document} onChange={(event) => setForm({ ...form, document: event.target.value })} /></Field>
            <Field label="Telefone"><input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></Field>
            <Field label="E-mail"><input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></Field>
            <Field label="Endereço"><input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /></Field>
            <Field label="Cidade"><input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} /></Field>
            <Field label="Estado"><select value={form.state} onChange={(event) => setForm({ ...form, state: event.target.value })}><option>SP</option><option>MG</option><option>RJ</option><option>PR</option><option>SC</option><option>RS</option><option>BA</option><option>GO</option><option>DF</option></select></Field>
            <div className="field full"><button className="btn btn-primary">Cadastrar unidade</button></div>
          </form>
        </div>

        <div className="card">
          <div className="card-header"><div><h2 className="card-title">Unidade ativa</h2><p className="card-description">A seleção define o contexto operacional demonstrativo do sistema.</p></div></div>
          <div className="appointment-list">
            {clinics.filter((clinic) => clinic.id === activeClinicId).map((clinic) => <div className="appointment-item" key={clinic.id}><div className="time-box">UNI</div><div><p className="item-title">{clinic.name}</p><p className="item-meta">{clinic.city}/{clinic.state} · {clinic.active ? "Ativa" : "Inativa"}</p></div></div>)}
          </div>
        </div>
      </section>

      <section className="card" style={{ marginTop: 18 }}>
        <div className="card-header"><div><h2 className="card-title">Unidades cadastradas</h2><p className="card-description">Selecione, ative ou desative consultórios do cliente.</p></div></div>
        <div className="field" style={{ marginBottom: 14 }}><input placeholder="Buscar por nome, documento, cidade ou estado" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
        <div className="table-wrap"><table><thead><tr><th>Unidade</th><th>Localização</th><th>Contato</th><th>Status</th><th>Ações</th></tr></thead><tbody>{filtered.map((clinic) => <tr key={clinic.id}><td>{clinic.name}<br /><small>{clinic.document || "Sem documento"}</small></td><td>{clinic.city}/{clinic.state}<br /><small>{clinic.address || "Sem endereço"}</small></td><td>{clinic.phone || "-"}<br /><small>{clinic.email || "-"}</small></td><td><span className={clinic.active ? "badge badge-green" : "badge badge-red"}>{clinic.active ? "Ativa" : "Inativa"}</span>{clinic.id === activeClinicId && <><br /><small>Unidade selecionada</small></>}</td><td><div className="top-actions"><button className="btn btn-secondary" disabled={!clinic.active || clinic.id === activeClinicId} onClick={() => selectClinic(clinic.id)}>Selecionar</button><button className="btn btn-secondary" onClick={() => toggleClinic(clinic.id)}>{clinic.active ? "Desativar" : "Ativar"}</button></div></td></tr>)}</tbody></table></div>
      </section>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="field"><label>{label}</label>{children}</div>; }
function Stat({ label, value, hint }: { label: string; value: string; hint: string }) { return <div className="card stat-card"><p className="stat-label">{label}</p><p className="stat-value">{value}</p><p className="stat-hint">{hint}</p></div>; }
