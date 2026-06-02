"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import styles from "./schedule.module.css";

type Screen = "dashboard" | "agenda" | "pacientes" | "atendimento" | "relatorios" | "configuracoes";
type Status = "Agendada" | "Confirmada" | "Em atendimento" | "Atendida" | "Faltou" | "Cancelada" | "Remarcada";
type PatientStatus = "Ativo" | "Pausado" | "Alta" | "Inativo";
type Mode = "Presencial" | "Online" | "Híbrido";
type AgendaView = "dia" | "mes";

type Patient = { id: string; name: string; phone: string; insurance: string; status: PatientStatus; value: number };
type Appointment = { id: string; patientId: string; date: string; time: string; duration: number; professional: string; room: string; mode: Mode; status: Status; value: number };
type Note = { appointmentId: string; content: string; finalized: boolean; updatedAt: string };

type PersistedState = {
  patients: Patient[];
  appointments: Appointment[];
  notes: Note[];
};

const today = new Date();
const isoToday = today.toISOString().slice(0, 10);
const STORAGE_KEY = "clinicflow-psico-mvp-state-v1";
const slots = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

const initialPatients: Patient[] = [
  { id: "p1", name: "Mariana Oliveira", phone: "(19) 99999-1000", insurance: "Particular", status: "Ativo", value: 180 },
  { id: "p2", name: "Carlos Mendes", phone: "(19) 98888-2000", insurance: "UNIMED", status: "Ativo", value: 140 },
  { id: "p3", name: "Fernanda Lima", phone: "(19) 97777-3000", insurance: "Particular", status: "Pausado", value: 200 },
];

const initialAppointments: Appointment[] = [
  { id: "a1", patientId: "p1", date: isoToday, time: "09:00", duration: 50, professional: "Dra. Ana Psicóloga", room: "Sala 01", mode: "Presencial", status: "Confirmada", value: 180 },
  { id: "a2", patientId: "p2", date: isoToday, time: "11:00", duration: 50, professional: "Dra. Ana Psicóloga", room: "Online", mode: "Online", status: "Agendada", value: 140 },
  { id: "a3", patientId: "p3", date: isoToday, time: "15:30", duration: 50, professional: "Dra. Ana Psicóloga", room: "Sala 02", mode: "Presencial", status: "Remarcada", value: 200 },
];

const menu: { id: Screen; label: string; icon: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: "◎" },
  { id: "agenda", label: "Agenda", icon: "◷" },
  { id: "pacientes", label: "Pacientes", icon: "◉" },
  { id: "atendimento", label: "Atendimento", icon: "✎" },
  { id: "relatorios", label: "Relatórios", icon: "▤" },
  { id: "configuracoes", label: "Configurações", icon: "⚙" },
];

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatDate(value: string) {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function addDays(base: Date, days: number) {
  const date = new Date(base);
  date.setDate(date.getDate() + days);
  return date;
}

function toIso(date: Date) {
  return date.toISOString().slice(0, 10);
}

function monthDays(base: Date) {
  const first = new Date(base.getFullYear(), base.getMonth(), 1);
  return Array.from({ length: 35 }, (_, index) => addDays(first, index));
}

function createId(prefix: string) {
  return `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

function loadPersistedState(): PersistedState | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    return {
      patients: Array.isArray(parsed.patients) ? parsed.patients : initialPatients,
      appointments: Array.isArray(parsed.appointments) ? parsed.appointments : initialAppointments,
      notes: Array.isArray(parsed.notes) ? parsed.notes : [],
    };
  } catch {
    return null;
  }
}

function savePersistedState(state: PersistedState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export default function Home() {
  const [active, setActive] = useState<Screen>("dashboard");
  const [agendaView, setAgendaView] = useState<AgendaView>("dia");
  const [selectedDate, setSelectedDate] = useState(isoToday);
  const [patients, setPatients] = useState(initialPatients);
  const [appointments, setAppointments] = useState(initialAppointments);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState("a1");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"Todos" | Status>("Todos");
  const [hydrated, setHydrated] = useState(false);
  const [saveStatus, setSaveStatus] = useState("Dados locais prontos");
  const [patientForm, setPatientForm] = useState({ name: "", phone: "", insurance: "Particular", status: "Ativo" as PatientStatus, value: "180" });
  const [appointmentForm, setAppointmentForm] = useState({ patientId: "p1", date: isoToday, time: "08:00", duration: "50", professional: "Dra. Ana Psicóloga", room: "Sala 01", mode: "Presencial" as Mode, status: "Agendada" as Status, value: "180" });
  const [editor, setEditor] = useState("Demanda apresentada:\n\nIntervenções realizadas:\n\nEvolução observada:\n\nPlano para próxima sessão:");

  useEffect(() => {
    const persisted = loadPersistedState();
    if (persisted) {
      setPatients(persisted.patients);
      setAppointments(persisted.appointments);
      setNotes(persisted.notes);
      setSelectedAppointmentId(persisted.appointments[0]?.id || "");
      setAppointmentForm((current) => ({ ...current, patientId: persisted.patients[0]?.id || "" }));
      setSaveStatus("Dados locais restaurados");
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    savePersistedState({ patients, appointments, notes });
    setSaveStatus(`Salvo localmente às ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`);
  }, [appointments, hydrated, notes, patients]);

  const week = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(today, index - 1)), []);
  const month = useMemo(() => monthDays(today), []);
  const dayAppointments = useMemo(() => appointments.filter((item) => item.date === selectedDate).sort((a, b) => a.time.localeCompare(b.time)), [appointments, selectedDate]);
  const selectedAppointment = appointments.find((item) => item.id === selectedAppointmentId) || appointments[0];
  const selectedPatient = patients.find((item) => item.id === selectedAppointment?.patientId) || patients[0];
  const finished = appointments.filter((item) => item.status === "Atendida");
  const expectedRevenue = appointments.filter((item) => item.status !== "Cancelada").reduce((total, item) => total + item.value, 0);
  const realizedRevenue = finished.reduce((total, item) => total + item.value, 0);
  const todayLoad = Math.round((appointments.filter((item) => item.date === isoToday).length / slots.length) * 100);
  const finalizedNotes = notes.filter((note) => note.finalized).length;

  function patientName(id: string) {
    return patients.find((patient) => patient.id === id)?.name || "Paciente não encontrado";
  }

  const filteredDayAppointments = useMemo(
    () => dayAppointments.filter((item) => (statusFilter === "Todos" || item.status === statusFilter) && patientName(item.patientId).toLowerCase().includes(search.toLowerCase())),
    [dayAppointments, search, statusFilter, patients]
  );

  function statusClass(status: Status) {
    if (status === "Atendida") return "badge badge-green";
    if (status === "Faltou" || status === "Cancelada") return "badge badge-red";
    if (status === "Remarcada" || status === "Em atendimento") return "badge badge-yellow";
    return "badge badge-blue";
  }

  function createPatient(event: FormEvent) {
    event.preventDefault();
    if (!patientForm.name.trim()) return alert("Informe o nome do paciente.");

    const newPatient: Patient = {
      id: createId("p"),
      name: patientForm.name.trim(),
      phone: patientForm.phone.trim(),
      insurance: patientForm.insurance,
      status: patientForm.status,
      value: Number(patientForm.value || 0),
    };

    setPatients((current) => [newPatient, ...current]);
    setAppointmentForm((current) => ({ ...current, patientId: newPatient.id, value: String(newPatient.value) }));
    setPatientForm({ name: "", phone: "", insurance: "Particular", status: "Ativo", value: "180" });
  }

  function createAppointment(event: FormEvent) {
    event.preventDefault();
    const item: Appointment = {
      id: createId("a"),
      patientId: appointmentForm.patientId,
      date: appointmentForm.date,
      time: appointmentForm.time,
      duration: Number(appointmentForm.duration),
      professional: appointmentForm.professional.trim(),
      room: appointmentForm.room.trim(),
      mode: appointmentForm.mode,
      status: appointmentForm.status,
      value: Number(appointmentForm.value || 0),
    };

    setAppointments((current) => [item, ...current]);
    setSelectedDate(item.date);
    setSelectedAppointmentId(item.id);
  }

  function openAttendance(item: Appointment) {
    setSelectedAppointmentId(item.id);
    setEditor(notes.find((note) => note.appointmentId === item.id)?.content || `Paciente: ${patientName(item.patientId)}\nData: ${formatDate(item.date)} às ${item.time}\nSala/Canal: ${item.room}\n\nDemanda apresentada:\n\nIntervenções realizadas:\n\nEvolução observada:\n\nPlano para próxima sessão:`);
    setActive("atendimento");
  }

  function setAppointmentStatus(item: Appointment, status: Status) {
    setAppointments((current) => current.map((row) => (row.id === item.id ? { ...row, status } : row)));
  }

  function saveNote(finalized: boolean) {
    if (!selectedAppointment) return;

    setNotes((current) => [
      { appointmentId: selectedAppointment.id, content: editor, finalized, updatedAt: new Date().toISOString() },
      ...current.filter((note) => note.appointmentId !== selectedAppointment.id),
    ]);

    if (finalized) setAppointmentStatus(selectedAppointment, "Atendida");
  }

  function resetDemoData() {
    if (!window.confirm("Deseja apagar os dados locais do MVP e restaurar os exemplos iniciais?")) return;
    window.localStorage.removeItem(STORAGE_KEY);
    setPatients(initialPatients);
    setAppointments(initialAppointments);
    setNotes([]);
    setSelectedAppointmentId(initialAppointments[0].id);
    setSelectedDate(isoToday);
    setSaveStatus("Dados de demonstração restaurados");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">CP</div><div><h1 className="brand-title">ClinicFlow Psico</h1><p className="brand-subtitle">Gestão para psicólogos</p></div></div>
        <nav className="nav-list">{menu.map((item) => <button key={item.id} className={`nav-button ${active === item.id ? "active" : ""}`} onClick={() => setActive(item.id)}><span className="nav-label"><span>{item.icon}</span>{item.label}</span><span>›</span></button>)}</nav>
        <div className="sidebar-card"><strong>MVP clínico-administrativo</strong><p>Agenda profissional, pacientes, evolução e relatórios com persistência local para validação.</p><button className="btn btn-primary" onClick={() => setActive("agenda")}>Abrir agenda</button></div>
      </aside>

      <main className="main-area">
        <header className="topbar"><div><p className="page-kicker">ClinicFlow Psico · {saveStatus}</p><h2 className="page-title">{menu.find((item) => item.id === active)?.label}</h2><p className="page-description">Sistema web moderno para organizar pacientes, agenda, apontamentos clínicos e indicadores da clínica.</p></div><div className="top-actions"><button className="btn btn-secondary" onClick={() => setActive("pacientes")}>Novo paciente</button><button className="btn btn-primary" onClick={() => setActive("agenda")}>Nova consulta</button></div></header>

        {active === "dashboard" && <section className="grid"><div className="grid stats-grid"><Stat label="Consultas hoje" value={String(appointments.filter((item) => item.date === isoToday).length)} hint={`${todayLoad}% da grade ocupada`} /><Stat label="Pacientes ativos" value={String(patients.filter((item) => item.status === "Ativo").length)} hint="Base em acompanhamento" /><Stat label="Receita prevista" value={money(expectedRevenue)} hint="Consultas não canceladas" /><Stat label="Receita realizada" value={money(realizedRevenue)} hint="Consultas atendidas" /></div><div className="grid two-column"><AgendaPreview week={week} selectedDate={selectedDate} setSelectedDate={setSelectedDate} appointments={dayAppointments} patientName={patientName} statusClass={statusClass} openAttendance={openAttendance} /><StatusBoard appointments={appointments} /></div></section>}

        {active === "agenda" && <section className="grid two-column"><div className="card"><div className="card-header"><div><h3 className="card-title">Agenda profissional</h3><p className="card-description">Calendário, alocação por horário e visão mensal para controlar o dia da clínica.</p></div></div><div className={styles.agendaToolbar}><div className={styles.segmented}><button className={agendaView === "dia" ? styles.active : ""} onClick={() => setAgendaView("dia")}>Dia</button><button className={agendaView === "mes" ? styles.active : ""} onClick={() => setAgendaView("mes")}>Mês</button></div><div className={styles.quickFilters}><input className={styles.searchInput} placeholder="Buscar paciente" value={search} onChange={(e) => setSearch(e.target.value)} /><select className={styles.selectInput} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "Todos" | Status)}><option>Todos</option><option>Agendada</option><option>Confirmada</option><option>Em atendimento</option><option>Atendida</option><option>Faltou</option><option>Cancelada</option><option>Remarcada</option></select></div></div><AgendaPreview week={week} selectedDate={selectedDate} setSelectedDate={setSelectedDate} appointments={filteredDayAppointments} patientName={patientName} statusClass={statusClass} openAttendance={openAttendance} embedded />{agendaView === "dia" ? <Timeline appointments={filteredDayAppointments} selectedDate={selectedDate} patientName={patientName} statusClass={statusClass} openAttendance={openAttendance} setAppointmentStatus={setAppointmentStatus} /> : <MonthView days={month} appointments={appointments} patientName={patientName} openAttendance={openAttendance} />}</div><AppointmentForm patients={patients} form={appointmentForm} setForm={setAppointmentForm} onSubmit={createAppointment} /></section>}

        {active === "pacientes" && <section className="grid two-column"><div className="card"><div className="card-header"><div><h3 className="card-title">Pacientes</h3><p className="card-description">Cadastro administrativo inicial do MVP.</p></div></div><div className="table-wrap"><table><thead><tr><th>Nome</th><th>Telefone</th><th>Convênio</th><th>Status</th><th>Valor</th></tr></thead><tbody>{patients.map((p) => <tr key={p.id}><td>{p.name}</td><td>{p.phone}</td><td>{p.insurance}</td><td><span className={p.status === "Ativo" ? "badge badge-green" : "badge badge-yellow"}>{p.status}</span></td><td>{money(p.value)}</td></tr>)}</tbody></table></div></div><PatientForm form={patientForm} setForm={setPatientForm} onSubmit={createPatient} /></section>}

        {active === "atendimento" && <section className="grid two-column"><div className="card"><div className="card-header"><div><h3 className="card-title">Editor de evolução</h3><p className="card-description">Apontamento clínico da sessão selecionada. Rascunhos e finalizações ficam salvos localmente no MVP.</p></div><span className={statusClass(selectedAppointment.status)}>{selectedAppointment.status}</span></div><textarea className="editor" value={editor} onChange={(e) => setEditor(e.target.value)} /><div className="top-actions" style={{ marginTop: 16 }}><button className="btn btn-secondary" onClick={() => saveNote(false)}>Salvar rascunho</button><button className="btn btn-primary" onClick={() => saveNote(true)}>Finalizar atendimento</button></div></div><div className="card"><div className="card-header"><div><h3 className="card-title">Resumo da sessão</h3><p className="card-description">Dados administrativos separados do apontamento.</p></div></div><div className="appointment-list"><div className="appointment-item"><div className="time-box">{selectedAppointment.time}</div><div><p className="item-title">{selectedPatient.name}</p><p className="item-meta">{formatDate(selectedAppointment.date)} · {selectedAppointment.mode} · {selectedAppointment.room} · {money(selectedAppointment.value)}</p></div></div>{appointments.map((item) => <button key={item.id} className="nav-button" onClick={() => openAttendance(item)}><span>{item.time} · {patientName(item.patientId)}</span><span>›</span></button>)}</div></div></section>}
        {active === "relatorios" && <ReportSummary patients={patients.length} appointments={appointments.length} notes={notes.length} finalized={finalizedNotes} pending={Math.max(0, finished.length - finalizedNotes)} />}
        {active === "configuracoes" && <section className="grid two-column"><div className="card"><div className="card-header"><div><h3 className="card-title">Configurações iniciais</h3><p className="card-description">Base preparada para perfis Administrador, Psicólogo, Secretária e Financeiro.</p></div></div><div className="grid stats-grid"><Stat label="Multiempresa" value="Próximo" hint="Clinic/Company no banco" /><Stat label="Autenticação" value="Próximo" hint="Login e perfis" /><Stat label="Auditoria" value="Próximo" hint="LGPD e histórico" /><Stat label="Banco" value="Próximo" hint="Prisma + PostgreSQL" /></div></div><div className="card"><div className="card-header"><div><h3 className="card-title">Dados locais do MVP</h3><p className="card-description">Enquanto não ligarmos Prisma/PostgreSQL, os dados ficam no navegador para validar o fluxo.</p></div></div><div className="appointment-list"><div className="appointment-item"><div className="time-box">DB</div><div><p className="item-title">Persistência local ativa</p><p className="item-meta">{saveStatus} · {patients.length} pacientes · {appointments.length} consultas · {notes.length} evoluções</p></div></div><button className="btn btn-secondary" onClick={resetDemoData}>Restaurar dados de demonstração</button></div></div></section>}
      </main>
      <nav className="mobile-nav">{menu.slice(0, 5).map((item) => <button key={item.id} className={active === item.id ? "active" : ""} onClick={() => setActive(item.id)}>{item.icon}<br />{item.label}</button>)}</nav>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) { return <div className="card stat-card"><p className="stat-label">{label}</p><p className="stat-value">{value}</p><p className="stat-hint">{hint}</p></div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="field"><label>{label}</label>{children}</div>; }

function AgendaPreview({ week, selectedDate, setSelectedDate, appointments, patientName, statusClass, openAttendance, embedded }: { week: Date[]; selectedDate: string; setSelectedDate: (date: string) => void; appointments: Appointment[]; patientName: (id: string) => string; statusClass: (status: Status) => string; openAttendance: (item: Appointment) => void; embedded?: boolean }) {
  return <div className={embedded ? "" : "card"}>{!embedded && <div className="card-header"><div><h3 className="card-title">Agenda e calendário</h3><p className="card-description">Alocação das consultas do dia selecionado.</p></div></div>}<div className="calendar-strip">{week.map((date) => { const iso = toIso(date); return <button key={iso} className={`day-pill ${selectedDate === iso ? "active" : ""}`} onClick={() => setSelectedDate(iso)}><span className="day-name">{date.toLocaleDateString("pt-BR", { weekday: "short" })}</span><span className="day-number">{date.getDate()}</span></button>; })}</div>{!embedded && <div className="appointment-list">{appointments.length === 0 ? <div className="empty-state">Nenhuma consulta alocada para este dia.</div> : appointments.map((item) => <div className="appointment-item" key={item.id}><div className="time-box">{item.time}</div><div><p className="item-title">{patientName(item.patientId)}</p><p className="item-meta">{item.professional} · {item.mode} · {item.duration} min · {money(item.value)}</p></div><div className="top-actions"><span className={statusClass(item.status)}>{item.status}</span><button className="btn btn-secondary" onClick={() => openAttendance(item)}>Atender</button></div></div>)}</div>}</div>;
}

function Timeline({ appointments, selectedDate, patientName, statusClass, openAttendance, setAppointmentStatus }: { appointments: Appointment[]; selectedDate: string; patientName: (id: string) => string; statusClass: (status: Status) => string; openAttendance: (item: Appointment) => void; setAppointmentStatus: (item: Appointment, status: Status) => void }) {
  return <div className={styles.timeline}>{slots.map((slot) => { const rows = appointments.filter((item) => item.time.startsWith(slot.slice(0, 2))); return <div className={styles.slotRow} key={slot}><div className={styles.slotTime}>{slot}</div><div className={styles.slotContent}>{rows.length === 0 ? <div className={styles.slotEmpty}><span>Horário livre em {formatDate(selectedDate)}</span><span className="badge badge-blue">Disponível</span></div> : rows.map((item) => <div className={styles.slotEvent} key={item.id}><div><strong>{patientName(item.patientId)}</strong><p className={styles.slotMeta}>{item.professional} · {item.room} · {item.mode} · {item.duration} min · {money(item.value)}</p></div><div className="top-actions"><span className={statusClass(item.status)}>{item.status}</span><select className={styles.selectInput} value={item.status} onChange={(e) => setAppointmentStatus(item, e.target.value as Status)}><option>Agendada</option><option>Confirmada</option><option>Em atendimento</option><option>Atendida</option><option>Faltou</option><option>Cancelada</option><option>Remarcada</option></select><button className="btn btn-secondary" onClick={() => openAttendance(item)}>Atender</button></div></div>)}</div></div>; })}</div>;
}

function MonthView({ days, appointments, patientName, openAttendance }: { days: Date[]; appointments: Appointment[]; patientName: (id: string) => string; openAttendance: (item: Appointment) => void }) { return <div className={styles.monthGrid}>{days.map((day) => { const iso = toIso(day); const rows = appointments.filter((item) => item.date === iso); return <div key={iso} className={`${styles.monthCell} ${iso === isoToday ? styles.today : ""}`}><div className={styles.monthDay}>{day.getDate()}</div>{rows.slice(0, 3).map((item) => <button key={item.id} className={styles.monthEvent} onClick={() => openAttendance(item)}>{item.time} · {patientName(item.patientId)}</button>)}</div>; })}</div>; }
function StatusBoard({ appointments }: { appointments: Appointment[] }) { const statuses: Status[] = ["Agendada", "Confirmada", "Em atendimento", "Atendida", "Faltou", "Cancelada", "Remarcada"]; const max = Math.max(1, appointments.length); return <div className="card"><div className="card-header"><div><h3 className="card-title">Painel de status</h3><p className="card-description">Distribuição das consultas cadastradas.</p></div></div><div className={styles.statusBoard}>{statuses.map((status) => { const total = appointments.filter((item) => item.status === status).length; return <div className={styles.statusLine} key={status}><div><strong>{status}</strong><div className={styles.progressTrack}><div className={styles.progressFill} style={{ width: `${(total / max) * 100}%` }} /></div></div><span className="badge badge-blue">{total}</span></div>; })}</div></div>; }
function ReportSummary({ patients, appointments, notes, finalized, pending }: { patients: number; appointments: number; notes: number; finalized: number; pending: number }) { return <section className="card"><div className="card-header"><div><h3 className="card-title">Relatórios iniciais</h3><p className="card-description">Indicadores para validar o fluxo antes do banco definitivo.</p></div></div><div className="grid stats-grid"><Stat label="Pacientes" value={String(patients)} hint="Cadastrados no MVP" /><Stat label="Consultas" value={String(appointments)} hint="Agenda carregada" /><Stat label="Evoluções" value={String(notes)} hint={`${finalized} finalizadas`} /><Stat label="Pendências" value={String(Math.max(0, pending))} hint="Atendidas sem evolução" /></div></section>; }
function PatientForm({ form, setForm, onSubmit }: { form: { name: string; phone: string; insurance: string; status: PatientStatus; value: string }; setForm: (form: { name: string; phone: string; insurance: string; status: PatientStatus; value: string }) => void; onSubmit: (event: FormEvent) => void }) { return <div className="card"><div className="card-header"><div><h3 className="card-title">Novo paciente</h3><p className="card-description">Campos enumeráveis já nascem como selects.</p></div></div><form className="form-grid" onSubmit={onSubmit}><Field label="Nome"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field><Field label="Telefone"><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field><Field label="Convênio"><select value={form.insurance} onChange={(e) => setForm({ ...form, insurance: e.target.value })}><option>Particular</option><option>UNIMED</option><option>AMIL</option><option>Bradesco Saúde</option><option>SulAmérica</option></select></Field><Field label="Status"><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as PatientStatus })}><option>Ativo</option><option>Pausado</option><option>Alta</option><option>Inativo</option></select></Field><Field label="Valor sessão"><input value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} /></Field><div className="field full"><button className="btn btn-primary">Salvar paciente</button></div></form></div>; }
function AppointmentForm({ patients, form, setForm, onSubmit }: { patients: Patient[]; form: { patientId: string; date: string; time: string; duration: string; professional: string; room: string; mode: Mode; status: Status; value: string }; setForm: (form: { patientId: string; date: string; time: string; duration: string; professional: string; room: string; mode: Mode; status: Status; value: string }) => void; onSubmit: (event: FormEvent) => void }) { return <div className="card"><div className="card-header"><div><h3 className="card-title">Nova consulta</h3><p className="card-description">Cadastre rapidamente uma sessão na agenda.</p></div></div><form className="form-grid" onSubmit={onSubmit}><Field label="Paciente"><select value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })}>{patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field><Field label="Data"><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field><Field label="Hora"><input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></Field><Field label="Duração"><select value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })}><option>30</option><option>50</option><option>60</option><option>90</option></select></Field><Field label="Sala/Canal"><input value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} /></Field><Field label="Modalidade"><select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value as Mode })}><option>Presencial</option><option>Online</option><option>Híbrido</option></select></Field><Field label="Status"><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Status })}><option>Agendada</option><option>Confirmada</option><option>Em atendimento</option><option>Atendida</option><option>Faltou</option><option>Cancelada</option><option>Remarcada</option></select></Field><Field label="Valor"><input value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} /></Field><Field label="Profissional"><input value={form.professional} onChange={(e) => setForm({ ...form, professional: e.target.value })} /></Field><div className="field full"><button className="btn btn-primary">Salvar consulta</button></div></form></div>; }
