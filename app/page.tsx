"use client";

import { FormEvent, useMemo, useState } from "react";

type Screen = "dashboard" | "agenda" | "pacientes" | "atendimento" | "relatorios" | "configuracoes";
type Status = "Agendada" | "Confirmada" | "Em atendimento" | "Atendida" | "Faltou" | "Cancelada" | "Remarcada";
type PatientStatus = "Ativo" | "Pausado" | "Alta" | "Inativo";
type Mode = "Presencial" | "Online" | "Híbrido";

type Patient = {
  id: string;
  name: string;
  phone: string;
  insurance: string;
  status: PatientStatus;
  value: number;
};

type Appointment = {
  id: string;
  patientId: string;
  date: string;
  time: string;
  duration: number;
  professional: string;
  mode: Mode;
  status: Status;
  value: number;
};

type Note = {
  appointmentId: string;
  content: string;
  finalized: boolean;
};

const today = new Date();
const isoToday = today.toISOString().slice(0, 10);

const initialPatients: Patient[] = [
  { id: "p1", name: "Mariana Oliveira", phone: "(19) 99999-1000", insurance: "Particular", status: "Ativo", value: 180 },
  { id: "p2", name: "Carlos Mendes", phone: "(19) 98888-2000", insurance: "UNIMED", status: "Ativo", value: 140 },
  { id: "p3", name: "Fernanda Lima", phone: "(19) 97777-3000", insurance: "Particular", status: "Pausado", value: 200 },
];

const initialAppointments: Appointment[] = [
  { id: "a1", patientId: "p1", date: isoToday, time: "09:00", duration: 50, professional: "Dra. Ana Psicóloga", mode: "Presencial", status: "Confirmada", value: 180 },
  { id: "a2", patientId: "p2", date: isoToday, time: "11:00", duration: 50, professional: "Dra. Ana Psicóloga", mode: "Online", status: "Agendada", value: 140 },
  { id: "a3", patientId: "p3", date: isoToday, time: "15:30", duration: 50, professional: "Dra. Ana Psicóloga", mode: "Presencial", status: "Remarcada", value: 200 },
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
  const [y, m, d] = value.split("-");
  return `${d}/${m}/${y}`;
}

function addDays(base: Date, days: number) {
  const date = new Date(base);
  date.setDate(date.getDate() + days);
  return date;
}

function toIso(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default function Home() {
  const [active, setActive] = useState<Screen>("dashboard");
  const [selectedDate, setSelectedDate] = useState(isoToday);
  const [patients, setPatients] = useState(initialPatients);
  const [appointments, setAppointments] = useState(initialAppointments);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState("a1");
  const [patientForm, setPatientForm] = useState({ name: "", phone: "", insurance: "Particular", status: "Ativo" as PatientStatus, value: "180" });
  const [appointmentForm, setAppointmentForm] = useState({ patientId: "p1", date: isoToday, time: "08:00", duration: "50", professional: "Dra. Ana Psicóloga", mode: "Presencial" as Mode, status: "Agendada" as Status, value: "180" });
  const [editor, setEditor] = useState("Demanda apresentada:\n\nIntervenções realizadas:\n\nEvolução observada:\n\nPlano para próxima sessão:");

  const week = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(today, index - 1)), []);
  const dayAppointments = useMemo(() => appointments.filter((item) => item.date === selectedDate).sort((a, b) => a.time.localeCompare(b.time)), [appointments, selectedDate]);
  const selectedAppointment = appointments.find((item) => item.id === selectedAppointmentId) || appointments[0];
  const selectedPatient = patients.find((item) => item.id === selectedAppointment?.patientId) || patients[0];
  const finished = appointments.filter((item) => item.status === "Atendida");
  const expectedRevenue = appointments.filter((item) => item.status !== "Cancelada").reduce((total, item) => total + item.value, 0);
  const realizedRevenue = finished.reduce((total, item) => total + item.value, 0);

  function patientName(id: string) {
    return patients.find((patient) => patient.id === id)?.name || "Paciente não encontrado";
  }

  function statusClass(status: Status) {
    if (status === "Atendida") return "badge badge-green";
    if (status === "Faltou" || status === "Cancelada") return "badge badge-red";
    if (status === "Remarcada" || status === "Em atendimento") return "badge badge-yellow";
    return "badge badge-blue";
  }

  function createPatient(event: FormEvent) {
    event.preventDefault();
    if (!patientForm.name.trim()) return alert("Informe o nome do paciente.");
    setPatients([{ id: `p${Date.now()}`, name: patientForm.name, phone: patientForm.phone, insurance: patientForm.insurance, status: patientForm.status, value: Number(patientForm.value || 0) }, ...patients]);
    setPatientForm({ name: "", phone: "", insurance: "Particular", status: "Ativo", value: "180" });
  }

  function createAppointment(event: FormEvent) {
    event.preventDefault();
    const item: Appointment = { id: `a${Date.now()}`, patientId: appointmentForm.patientId, date: appointmentForm.date, time: appointmentForm.time, duration: Number(appointmentForm.duration), professional: appointmentForm.professional, mode: appointmentForm.mode, status: appointmentForm.status, value: Number(appointmentForm.value || 0) };
    setAppointments([item, ...appointments]);
    setSelectedDate(item.date);
    setSelectedAppointmentId(item.id);
  }

  function openAttendance(item: Appointment) {
    setSelectedAppointmentId(item.id);
    setEditor(notes.find((note) => note.appointmentId === item.id)?.content || `Paciente: ${patientName(item.patientId)}\nData: ${formatDate(item.date)} às ${item.time}\n\nDemanda apresentada:\n\nIntervenções realizadas:\n\nEvolução observada:\n\nPlano para próxima sessão:`);
    setActive("atendimento");
  }

  function saveNote(finalized: boolean) {
    if (!selectedAppointment) return;
    setNotes((current) => [{ appointmentId: selectedAppointment.id, content: editor, finalized }, ...current.filter((note) => note.appointmentId !== selectedAppointment.id)]);
    if (finalized) {
      setAppointments((current) => current.map((item) => item.id === selectedAppointment.id ? { ...item, status: "Atendida" } : item));
    }
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
          {menu.map((item) => (
            <button key={item.id} className={`nav-button ${active === item.id ? "active" : ""}`} onClick={() => setActive(item.id)}>
              <span className="nav-label"><span>{item.icon}</span>{item.label}</span><span>›</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-card">
          <strong>MVP clínico-administrativo</strong>
          <p>Agenda, pacientes, alocação diária, evolução e relatórios em uma base responsiva.</p>
          <button className="btn btn-primary" onClick={() => setActive("agenda")}>Abrir agenda</button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div>
            <p className="page-kicker">ClinicFlow Psico</p>
            <h2 className="page-title">{menu.find((item) => item.id === active)?.label}</h2>
            <p className="page-description">Sistema web moderno para organizar pacientes, agenda, apontamentos clínicos e indicadores da clínica.</p>
          </div>
          <div className="top-actions">
            <button className="btn btn-secondary" onClick={() => setActive("pacientes")}>Novo paciente</button>
            <button className="btn btn-primary" onClick={() => setActive("agenda")}>Nova consulta</button>
          </div>
        </header>

        {active === "dashboard" && (
          <section className="grid">
            <div className="grid stats-grid">
              <Stat label="Consultas hoje" value={String(appointments.filter((item) => item.date === isoToday).length)} hint="Agenda do dia atual" />
              <Stat label="Pacientes ativos" value={String(patients.filter((item) => item.status === "Ativo").length)} hint="Base em acompanhamento" />
              <Stat label="Receita prevista" value={money(expectedRevenue)} hint="Consultas não canceladas" />
              <Stat label="Receita realizada" value={money(realizedRevenue)} hint="Consultas atendidas" />
            </div>
            <div className="grid two-column">
              <AgendaCard week={week} selectedDate={selectedDate} setSelectedDate={setSelectedDate} appointments={dayAppointments} patientName={patientName} statusClass={statusClass} openAttendance={openAttendance} />
              <ReportSummary patients={patients.length} appointments={appointments.length} notes={notes.length} pending={finished.length - notes.filter((note) => note.finalized).length} />
            </div>
          </section>
        )}

        {active === "agenda" && (
          <section className="grid two-column">
            <div className="card">
              <div className="card-header"><div><h3 className="card-title">Alocação do dia</h3><p className="card-description">Selecione o dia no calendário e acompanhe os horários alocados.</p></div></div>
              <AgendaCard week={week} selectedDate={selectedDate} setSelectedDate={setSelectedDate} appointments={dayAppointments} patientName={patientName} statusClass={statusClass} openAttendance={openAttendance} embedded />
            </div>
            <div className="card">
              <div className="card-header"><div><h3 className="card-title">Nova consulta</h3><p className="card-description">Cadastre rapidamente uma sessão na agenda.</p></div></div>
              <form className="form-grid" onSubmit={createAppointment}>
                <Field label="Paciente"><select value={appointmentForm.patientId} onChange={(e) => setAppointmentForm({ ...appointmentForm, patientId: e.target.value })}>{patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
                <Field label="Data"><input type="date" value={appointmentForm.date} onChange={(e) => setAppointmentForm({ ...appointmentForm, date: e.target.value })} /></Field>
                <Field label="Hora"><input type="time" value={appointmentForm.time} onChange={(e) => setAppointmentForm({ ...appointmentForm, time: e.target.value })} /></Field>
                <Field label="Duração"><select value={appointmentForm.duration} onChange={(e) => setAppointmentForm({ ...appointmentForm, duration: e.target.value })}><option>30</option><option>50</option><option>60</option><option>90</option></select></Field>
                <Field label="Modalidade"><select value={appointmentForm.mode} onChange={(e) => setAppointmentForm({ ...appointmentForm, mode: e.target.value as Mode })}><option>Presencial</option><option>Online</option><option>Híbrido</option></select></Field>
                <Field label="Status"><select value={appointmentForm.status} onChange={(e) => setAppointmentForm({ ...appointmentForm, status: e.target.value as Status })}><option>Agendada</option><option>Confirmada</option><option>Em atendimento</option><option>Atendida</option><option>Faltou</option><option>Cancelada</option><option>Remarcada</option></select></Field>
                <Field label="Valor"><input value={appointmentForm.value} onChange={(e) => setAppointmentForm({ ...appointmentForm, value: e.target.value })} /></Field>
                <Field label="Profissional"><input value={appointmentForm.professional} onChange={(e) => setAppointmentForm({ ...appointmentForm, professional: e.target.value })} /></Field>
                <div className="field full"><button className="btn btn-primary">Salvar consulta</button></div>
              </form>
            </div>
          </section>
        )}

        {active === "pacientes" && (
          <section className="grid two-column">
            <div className="card"><div className="card-header"><div><h3 className="card-title">Pacientes</h3><p className="card-description">Cadastro administrativo inicial do MVP.</p></div></div><div className="table-wrap"><table><thead><tr><th>Nome</th><th>Telefone</th><th>Convênio</th><th>Status</th><th>Valor</th></tr></thead><tbody>{patients.map((p) => <tr key={p.id}><td>{p.name}</td><td>{p.phone}</td><td>{p.insurance}</td><td><span className="badge badge-green">{p.status}</span></td><td>{money(p.value)}</td></tr>)}</tbody></table></div></div>
            <div className="card"><div className="card-header"><div><h3 className="card-title">Novo paciente</h3><p className="card-description">Campos enumeráveis já nascem como selects.</p></div></div><form className="form-grid" onSubmit={createPatient}><Field label="Nome"><input value={patientForm.name} onChange={(e) => setPatientForm({ ...patientForm, name: e.target.value })} /></Field><Field label="Telefone"><input value={patientForm.phone} onChange={(e) => setPatientForm({ ...patientForm, phone: e.target.value })} /></Field><Field label="Convênio"><select value={patientForm.insurance} onChange={(e) => setPatientForm({ ...patientForm, insurance: e.target.value })}><option>Particular</option><option>UNIMED</option><option>AMIL</option><option>Bradesco Saúde</option><option>SulAmérica</option></select></Field><Field label="Status"><select value={patientForm.status} onChange={(e) => setPatientForm({ ...patientForm, status: e.target.value as PatientStatus })}><option>Ativo</option><option>Pausado</option><option>Alta</option><option>Inativo</option></select></Field><Field label="Valor sessão"><input value={patientForm.value} onChange={(e) => setPatientForm({ ...patientForm, value: e.target.value })} /></Field><div className="field full"><button className="btn btn-primary">Salvar paciente</button></div></form></div>
          </section>
        )}

        {active === "atendimento" && (
          <section className="grid two-column">
            <div className="card"><div className="card-header"><div><h3 className="card-title">Editor de evolução</h3><p className="card-description">Apontamento clínico da sessão selecionada.</p></div><span className={statusClass(selectedAppointment.status)}>{selectedAppointment.status}</span></div><textarea className="editor" value={editor} onChange={(e) => setEditor(e.target.value)} /><div className="top-actions" style={{ marginTop: 16 }}><button className="btn btn-secondary" onClick={() => saveNote(false)}>Salvar rascunho</button><button className="btn btn-primary" onClick={() => saveNote(true)}>Finalizar atendimento</button></div></div>
            <div className="card"><div className="card-header"><div><h3 className="card-title">Resumo da sessão</h3><p className="card-description">Dados administrativos separados do apontamento.</p></div></div><div className="appointment-list"><div className="appointment-item"><div className="time-box">{selectedAppointment.time}</div><div><p className="item-title">{selectedPatient.name}</p><p className="item-meta">{formatDate(selectedAppointment.date)} · {selectedAppointment.mode} · {selectedAppointment.duration} min · {money(selectedAppointment.value)}</p></div></div>{appointments.map((item) => <button key={item.id} className="nav-button" onClick={() => openAttendance(item)}><span>{item.time} · {patientName(item.patientId)}</span><span>›</span></button>)}</div></div>
          </section>
        )}

        {active === "relatorios" && <ReportSummary patients={patients.length} appointments={appointments.length} notes={notes.length} pending={Math.max(0, finished.length - notes.filter((note) => note.finalized).length)} />}

        {active === "configuracoes" && (
          <section className="card"><div className="card-header"><div><h3 className="card-title">Configurações iniciais</h3><p className="card-description">Base preparada para perfis Administrador, Psicólogo, Secretária e Financeiro.</p></div></div><div className="grid stats-grid"><Stat label="Multiempresa" value="Próximo" hint="Clinic/Company no banco" /><Stat label="Autenticação" value="Próximo" hint="Login e perfis" /><Stat label="Auditoria" value="Próximo" hint="LGPD e histórico" /><Stat label="Banco" value="Próximo" hint="Prisma + PostgreSQL" /></div></section>
        )}
      </main>

      <nav className="mobile-nav">{menu.slice(0, 5).map((item) => <button key={item.id} className={active === item.id ? "active" : ""} onClick={() => setActive(item.id)}>{item.icon}<br />{item.label}</button>)}</nav>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return <div className="card stat-card"><p className="stat-label">{label}</p><p className="stat-value">{value}</p><p className="stat-hint">{hint}</p></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="field"><label>{label}</label>{children}</div>;
}

function AgendaCard({ week, selectedDate, setSelectedDate, appointments, patientName, statusClass, openAttendance, embedded }: { week: Date[]; selectedDate: string; setSelectedDate: (date: string) => void; appointments: Appointment[]; patientName: (id: string) => string; statusClass: (status: Status) => string; openAttendance: (item: Appointment) => void; embedded?: boolean }) {
  return <div className={embedded ? "" : "card"}>{!embedded && <div className="card-header"><div><h3 className="card-title">Agenda e calendário</h3><p className="card-description">Alocação das consultas do dia selecionado.</p></div></div>}<div className="calendar-strip">{week.map((date) => { const iso = toIso(date); return <button key={iso} className={`day-pill ${selectedDate === iso ? "active" : ""}`} onClick={() => setSelectedDate(iso)}><span className="day-name">{date.toLocaleDateString("pt-BR", { weekday: "short" })}</span><span className="day-number">{date.getDate()}</span></button>; })}</div><div className="appointment-list">{appointments.length === 0 ? <div className="empty-state">Nenhuma consulta alocada para este dia.</div> : appointments.map((item) => <div className="appointment-item" key={item.id}><div className="time-box">{item.time}</div><div><p className="item-title">{patientName(item.patientId)}</p><p className="item-meta">{item.professional} · {item.mode} · {item.duration} min · {money(item.value)}</p></div><div className="top-actions"><span className={statusClass(item.status)}>{item.status}</span><button className="btn btn-secondary" onClick={() => openAttendance(item)}>Atender</button></div></div>)}</div></div>;
}

function ReportSummary({ patients, appointments, notes, pending }: { patients: number; appointments: number; notes: number; pending: number }) {
  return <section className="card"><div className="card-header"><div><h3 className="card-title">Relatórios iniciais</h3><p className="card-description">Indicadores para validar o fluxo antes do banco definitivo.</p></div></div><div className="grid stats-grid"><Stat label="Pacientes" value={String(patients)} hint="Cadastrados no MVP" /><Stat label="Consultas" value={String(appointments)} hint="Agenda carregada" /><Stat label="Evoluções" value={String(notes)} hint="Rascunhos e finalizadas" /><Stat label="Pendências" value={String(Math.max(0, pending))} hint="Atendidas sem evolução" /></div></section>;
}
