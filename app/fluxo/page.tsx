"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Patient = {
  id: string;
  name: string;
  phone: string;
  email: string;
  insurance: string;
  sessionValue: number;
  notes: string;
};

type Appointment = {
  id: string;
  patientId: string;
  date: string;
  time: string;
  status: "Agendada" | "Confirmada" | "Em atendimento" | "Atendida";
  mode: "Presencial" | "Online";
  value: number;
};

type Evolution = {
  id: string;
  appointmentId: string;
  patientId: string;
  text: string;
  finalized: boolean;
  updatedAt: string;
};

type FlowState = {
  patients: Patient[];
  appointments: Appointment[];
  evolutions: Evolution[];
};

const storageKey = "clinicflow-psico-e2e-flow-v1";
const today = new Date().toISOString().slice(0, 10);

const initialState: FlowState = {
  patients: [
    {
      id: "p1",
      name: "Paciente Demonstração",
      phone: "(19) 99999-0000",
      email: "paciente@demo.local",
      insurance: "Particular",
      sessionValue: 180,
      notes: "Ficha inicial para validar o processo completo.",
    },
  ],
  appointments: [
    {
      id: "a1",
      patientId: "p1",
      date: today,
      time: "09:00",
      status: "Confirmada",
      mode: "Presencial",
      value: 180,
    },
  ],
  evolutions: [],
};

function loadState(): FlowState {
  if (typeof window === "undefined") return initialState;
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return initialState;

  try {
    const parsed = JSON.parse(raw) as FlowState;
    return {
      patients: Array.isArray(parsed.patients) ? parsed.patients : initialState.patients,
      appointments: Array.isArray(parsed.appointments) ? parsed.appointments : initialState.appointments,
      evolutions: Array.isArray(parsed.evolutions) ? parsed.evolutions : [],
    };
  } catch {
    return initialState;
  }
}

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export default function EndToEndFlowPage() {
  const [state, setState] = useState<FlowState>(initialState);
  const [loaded, setLoaded] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState("p1");
  const [selectedAppointmentId, setSelectedAppointmentId] = useState("a1");
  const [patientForm, setPatientForm] = useState({
    name: "",
    phone: "",
    email: "",
    insurance: "Particular",
    sessionValue: "180",
    notes: "",
  });
  const [appointmentForm, setAppointmentForm] = useState({
    patientId: "p1",
    date: today,
    time: "10:00",
    status: "Agendada" as Appointment["status"],
    mode: "Presencial" as Appointment["mode"],
    value: "180",
  });
  const [evolutionText, setEvolutionText] = useState(
    "Demanda apresentada:\n\nIntervenções realizadas:\n\nEvolução observada:\n\nPlano para próxima sessão:"
  );

  useEffect(() => {
    const loadedState = loadState();
    setState(loadedState);
    setSelectedPatientId(loadedState.patients[0]?.id || "");
    setSelectedAppointmentId(loadedState.appointments[0]?.id || "");
    setAppointmentForm((current) => ({
      ...current,
      patientId: loadedState.patients[0]?.id || "",
      value: String(loadedState.patients[0]?.sessionValue || 180),
    }));
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  }, [loaded, state]);

  const selectedPatient = useMemo(
    () => state.patients.find((patient) => patient.id === selectedPatientId) || state.patients[0],
    [selectedPatientId, state.patients]
  );

  const selectedAppointment = useMemo(
    () => state.appointments.find((item) => item.id === selectedAppointmentId) || state.appointments[0],
    [selectedAppointmentId, state.appointments]
  );

  const patientAppointments = useMemo(
    () => state.appointments.filter((item) => item.patientId === selectedPatient?.id),
    [selectedPatient?.id, state.appointments]
  );

  const patientEvolutions = useMemo(
    () => state.evolutions.filter((item) => item.patientId === selectedPatient?.id),
    [selectedPatient?.id, state.evolutions]
  );

  function patientName(patientId: string) {
    return state.patients.find((patient) => patient.id === patientId)?.name || "Paciente não encontrado";
  }

  function createPatient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!patientForm.name.trim()) return alert("Informe o nome do paciente.");

    const patient: Patient = {
      id: createId("p"),
      name: patientForm.name.trim(),
      phone: patientForm.phone.trim(),
      email: patientForm.email.trim(),
      insurance: patientForm.insurance,
      sessionValue: Number(patientForm.sessionValue || 0),
      notes: patientForm.notes.trim(),
    };

    setState((current) => ({ ...current, patients: [patient, ...current.patients] }));
    setSelectedPatientId(patient.id);
    setAppointmentForm((current) => ({ ...current, patientId: patient.id, value: String(patient.sessionValue) }));
    setPatientForm({ name: "", phone: "", email: "", insurance: "Particular", sessionValue: "180", notes: "" });
  }

  function createAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const appointment: Appointment = {
      id: createId("a"),
      patientId: appointmentForm.patientId,
      date: appointmentForm.date,
      time: appointmentForm.time,
      status: appointmentForm.status,
      mode: appointmentForm.mode,
      value: Number(appointmentForm.value || 0),
    };

    setState((current) => ({ ...current, appointments: [appointment, ...current.appointments] }));
    setSelectedPatientId(appointment.patientId);
    setSelectedAppointmentId(appointment.id);
  }

  function openAppointment(appointment: Appointment) {
    setSelectedAppointmentId(appointment.id);
    setSelectedPatientId(appointment.patientId);
    const existing = state.evolutions.find((item) => item.appointmentId === appointment.id);
    setEvolutionText(
      existing?.text ||
        `Paciente: ${patientName(appointment.patientId)}\nData: ${appointment.date} ${appointment.time}\n\nDemanda apresentada:\n\nIntervenções realizadas:\n\nEvolução observada:\n\nPlano para próxima sessão:`
    );
  }

  function saveEvolution(finalized: boolean) {
    if (!selectedAppointment) return;
    const evolution: Evolution = {
      id: createId("e"),
      appointmentId: selectedAppointment.id,
      patientId: selectedAppointment.patientId,
      text: evolutionText,
      finalized,
      updatedAt: new Date().toISOString(),
    };

    setState((current) => ({
      ...current,
      appointments: current.appointments.map((item) =>
        item.id === selectedAppointment.id ? { ...item, status: finalized ? "Atendida" : "Em atendimento" } : item
      ),
      evolutions: [evolution, ...current.evolutions.filter((item) => item.appointmentId !== selectedAppointment.id)],
    }));
  }

  function resetFlow() {
    if (!window.confirm("Restaurar o fluxo de demonstração?")) return;
    window.localStorage.removeItem(storageKey);
    setState(initialState);
    setSelectedPatientId("p1");
    setSelectedAppointmentId("a1");
  }

  return (
    <main className="main-area">
      <header className="topbar">
        <div>
          <p className="page-kicker">ClinicFlow Psico · Processo completo</p>
          <h1 className="page-title">Paciente → Agenda → Atendimento → Histórico</h1>
          <p className="page-description">
            Fluxo fechado para validar o MVP como usuário real antes de migrarmos para Prisma e PostgreSQL.
          </p>
        </div>
        <div className="top-actions">
          <Link className="btn btn-secondary" href="/">Voltar ao painel</Link>
          <button className="btn btn-secondary" onClick={resetFlow}>Restaurar demo</button>
        </div>
      </header>

      <section className="grid stats-grid">
        <Stat label="Pacientes" value={String(state.patients.length)} hint="Cadastrados no fluxo" />
        <Stat label="Consultas" value={String(state.appointments.length)} hint="Alocadas na agenda" />
        <Stat label="Evoluções" value={String(state.evolutions.length)} hint="Rascunhos e finalizadas" />
        <Stat label="Receita prevista" value={money(state.appointments.reduce((total, item) => total + item.value, 0))} hint="Valor das consultas" />
      </section>

      <section className="grid two-column" style={{ marginTop: 18 }}>
        <div className="card">
          <div className="card-header"><div><h2 className="card-title">1. Cadastrar paciente</h2><p className="card-description">Crie a ficha administrativa e selecione o paciente automaticamente.</p></div></div>
          <form className="form-grid" onSubmit={createPatient}>
            <Field label="Nome"><input value={patientForm.name} onChange={(event) => setPatientForm({ ...patientForm, name: event.target.value })} /></Field>
            <Field label="Telefone"><input value={patientForm.phone} onChange={(event) => setPatientForm({ ...patientForm, phone: event.target.value })} /></Field>
            <Field label="E-mail"><input type="email" value={patientForm.email} onChange={(event) => setPatientForm({ ...patientForm, email: event.target.value })} /></Field>
            <Field label="Convênio"><select value={patientForm.insurance} onChange={(event) => setPatientForm({ ...patientForm, insurance: event.target.value })}><option>Particular</option><option>UNIMED</option><option>AMIL</option><option>Bradesco Saúde</option></select></Field>
            <Field label="Valor"><input value={patientForm.sessionValue} onChange={(event) => setPatientForm({ ...patientForm, sessionValue: event.target.value })} /></Field>
            <Field label="Observação"><textarea value={patientForm.notes} onChange={(event) => setPatientForm({ ...patientForm, notes: event.target.value })} /></Field>
            <div className="field full"><button className="btn btn-primary">Salvar paciente</button></div>
          </form>
        </div>

        <div className="card">
          <div className="card-header"><div><h2 className="card-title">Ficha selecionada</h2><p className="card-description">Clique em um paciente para trocar o contexto do processo.</p></div></div>
          <div className="appointment-list">
            {state.patients.map((patient) => (
              <button key={patient.id} className={`nav-button ${patient.id === selectedPatient?.id ? "active" : ""}`} onClick={() => setSelectedPatientId(patient.id)}>
                <span>{patient.name} · {patient.insurance}</span><span>{money(patient.sessionValue)}</span>
              </button>
            ))}
            <div className="appointment-item"><div className="time-box">Ficha</div><div><p className="item-title">{selectedPatient?.name}</p><p className="item-meta">{selectedPatient?.phone || "Sem telefone"} · {selectedPatient?.email || "Sem e-mail"}</p><p className="item-meta">{selectedPatient?.notes || "Sem observação administrativa"}</p></div></div>
          </div>
        </div>
      </section>

      <section className="grid two-column" style={{ marginTop: 18 }}>
        <div className="card">
          <div className="card-header"><div><h2 className="card-title">2. Criar consulta</h2><p className="card-description">A consulta nasce vinculada ao paciente selecionado.</p></div></div>
          <form className="form-grid" onSubmit={createAppointment}>
            <Field label="Paciente"><select value={appointmentForm.patientId} onChange={(event) => setAppointmentForm({ ...appointmentForm, patientId: event.target.value })}>{state.patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name}</option>)}</select></Field>
            <Field label="Data"><input type="date" value={appointmentForm.date} onChange={(event) => setAppointmentForm({ ...appointmentForm, date: event.target.value })} /></Field>
            <Field label="Hora"><input type="time" value={appointmentForm.time} onChange={(event) => setAppointmentForm({ ...appointmentForm, time: event.target.value })} /></Field>
            <Field label="Modalidade"><select value={appointmentForm.mode} onChange={(event) => setAppointmentForm({ ...appointmentForm, mode: event.target.value as Appointment["mode"] })}><option>Presencial</option><option>Online</option></select></Field>
            <Field label="Status"><select value={appointmentForm.status} onChange={(event) => setAppointmentForm({ ...appointmentForm, status: event.target.value as Appointment["status"] })}><option>Agendada</option><option>Confirmada</option><option>Em atendimento</option><option>Atendida</option></select></Field>
            <Field label="Valor"><input value={appointmentForm.value} onChange={(event) => setAppointmentForm({ ...appointmentForm, value: event.target.value })} /></Field>
            <div className="field full"><button className="btn btn-primary">Salvar consulta</button></div>
          </form>
        </div>

        <div className="card">
          <div className="card-header"><div><h2 className="card-title">Agenda do processo</h2><p className="card-description">Abra uma consulta para iniciar o atendimento.</p></div></div>
          <div className="appointment-list">
            {state.appointments.map((appointment) => (
              <div className="appointment-item" key={appointment.id}>
                <div className="time-box">{appointment.time}</div>
                <div><p className="item-title">{patientName(appointment.patientId)}</p><p className="item-meta">{appointment.date} · {appointment.mode} · {money(appointment.value)}</p></div>
                <div className="top-actions"><span className="badge badge-blue">{appointment.status}</span><button className="btn btn-secondary" onClick={() => openAppointment(appointment)}>Atender</button></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid two-column" style={{ marginTop: 18 }}>
        <div className="card">
          <div className="card-header"><div><h2 className="card-title">3. Atendimento e evolução</h2><p className="card-description">Salve rascunho ou finalize para atualizar a consulta como atendida.</p></div></div>
          <textarea className="editor" value={evolutionText} onChange={(event) => setEvolutionText(event.target.value)} />
          <div className="top-actions" style={{ marginTop: 16 }}>
            <button className="btn btn-secondary" onClick={() => saveEvolution(false)}>Salvar rascunho</button>
            <button className="btn btn-primary" onClick={() => saveEvolution(true)}>Finalizar atendimento</button>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><div><h2 className="card-title">4. Histórico do paciente</h2><p className="card-description">Consultas e evoluções aparecem vinculadas à ficha selecionada.</p></div></div>
          <div className="appointment-list">
            <strong>Consultas de {selectedPatient?.name}</strong>
            {patientAppointments.map((appointment) => <button className="nav-button" key={appointment.id} onClick={() => openAppointment(appointment)}><span>{appointment.date} · {appointment.time}</span><span>{appointment.status}</span></button>)}
            <strong>Evoluções</strong>
            {patientEvolutions.length === 0 ? <div className="empty-state">Nenhuma evolução registrada.</div> : patientEvolutions.map((item) => <div className="empty-state" key={item.id}>{item.finalized ? "Finalizada" : "Rascunho"} · {new Date(item.updatedAt).toLocaleString("pt-BR")}</div>)}
          </div>
        </div>
      </section>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="field"><label>{label}</label>{children}</div>;
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return <div className="card stat-card"><p className="stat-label">{label}</p><p className="stat-value">{value}</p><p className="stat-hint">{hint}</p></div>;
}
