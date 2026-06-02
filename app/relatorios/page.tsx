"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type AppointmentStatus = "Agendada" | "Confirmada" | "Em atendimento" | "Atendida" | "Faltou" | "Cancelada" | "Remarcada";

type Patient = {
  id: string;
  name: string;
  phone: string;
  insurance: string;
  status: string;
  value: number;
};

type Appointment = {
  id: string;
  patientId: string;
  date: string;
  time: string;
  duration: number;
  professional: string;
  room: string;
  mode: string;
  status: AppointmentStatus;
  value: number;
};

type Note = {
  appointmentId: string;
  content: string;
  finalized: boolean;
  updatedAt: string;
};

type MvpState = {
  patients: Patient[];
  appointments: Appointment[];
  notes: Note[];
};

const storageKey = "clinicflow-psico-mvp-state-v1";
const appointmentStatuses: AppointmentStatus[] = ["Agendada", "Confirmada", "Em atendimento", "Atendida", "Faltou", "Cancelada", "Remarcada"];

const fallbackState: MvpState = {
  patients: [
    { id: "p1", name: "Mariana Oliveira", phone: "(19) 99999-1000", insurance: "Particular", status: "Ativo", value: 180 },
    { id: "p2", name: "Carlos Mendes", phone: "(19) 98888-2000", insurance: "UNIMED", status: "Ativo", value: 140 },
  ],
  appointments: [],
  notes: [],
};

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatDate(value: string) {
  if (!value) return "-";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function loadMvpState(): MvpState {
  if (typeof window === "undefined") return fallbackState;
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return fallbackState;

  try {
    const parsed = JSON.parse(raw) as Partial<MvpState>;
    return {
      patients: Array.isArray(parsed.patients) ? parsed.patients : fallbackState.patients,
      appointments: Array.isArray(parsed.appointments) ? parsed.appointments : [],
      notes: Array.isArray(parsed.notes) ? parsed.notes : [],
    };
  } catch {
    return fallbackState;
  }
}

export default function ReportsPage() {
  const [state, setState] = useState<MvpState>(fallbackState);
  const [statusFilter, setStatusFilter] = useState<"Todos" | AppointmentStatus>("Todos");
  const [insuranceFilter, setInsuranceFilter] = useState("Todos");
  const [loadedAt, setLoadedAt] = useState("");

  useEffect(() => {
    setState(loadMvpState());
    setLoadedAt(new Date().toLocaleString("pt-BR"));
  }, []);

  const patientsById = useMemo(() => new Map(state.patients.map((patient) => [patient.id, patient])), [state.patients]);
  const finalizedNoteIds = useMemo(() => new Set(state.notes.filter((note) => note.finalized).map((note) => note.appointmentId)), [state.notes]);
  const insurances = useMemo(() => ["Todos", ...Array.from(new Set(state.patients.map((patient) => patient.insurance)))], [state.patients]);

  const filteredAppointments = useMemo(() => {
    return state.appointments.filter((appointment) => {
      const patient = patientsById.get(appointment.patientId);
      const statusMatches = statusFilter === "Todos" || appointment.status === statusFilter;
      const insuranceMatches = insuranceFilter === "Todos" || patient?.insurance === insuranceFilter;
      return statusMatches && insuranceMatches;
    });
  }, [insuranceFilter, patientsById, state.appointments, statusFilter]);

  const totals = useMemo(() => {
    const expected = filteredAppointments.filter((appointment) => appointment.status !== "Cancelada").reduce((total, appointment) => total + appointment.value, 0);
    const realized = filteredAppointments.filter((appointment) => appointment.status === "Atendida").reduce((total, appointment) => total + appointment.value, 0);
    const missed = filteredAppointments.filter((appointment) => appointment.status === "Faltou").length;
    const canceled = filteredAppointments.filter((appointment) => appointment.status === "Cancelada").length;
    const pendingEvolution = filteredAppointments.filter((appointment) => appointment.status === "Atendida" && !finalizedNoteIds.has(appointment.id)).length;
    return { expected, realized, missed, canceled, pendingEvolution };
  }, [filteredAppointments, finalizedNoteIds]);

  const statusRows = useMemo(() => {
    return appointmentStatuses.map((status) => ({
      status,
      total: filteredAppointments.filter((appointment) => appointment.status === status).length,
      value: filteredAppointments.filter((appointment) => appointment.status === status).reduce((total, appointment) => total + appointment.value, 0),
    }));
  }, [filteredAppointments]);

  const insuranceRows = useMemo(() => {
    return Array.from(new Set(state.patients.map((patient) => patient.insurance))).map((insurance) => {
      const patientIds = new Set(state.patients.filter((patient) => patient.insurance === insurance).map((patient) => patient.id));
      const appointments = filteredAppointments.filter((appointment) => patientIds.has(appointment.patientId));
      return {
        insurance,
        patients: patientIds.size,
        appointments: appointments.length,
        value: appointments.reduce((total, appointment) => total + appointment.value, 0),
      };
    });
  }, [filteredAppointments, state.patients]);

  const patientRows = useMemo(() => {
    return state.patients.map((patient) => {
      const appointments = filteredAppointments.filter((appointment) => appointment.patientId === patient.id);
      const attended = appointments.filter((appointment) => appointment.status === "Atendida");
      return {
        patient,
        appointments: appointments.length,
        attended: attended.length,
        value: attended.reduce((total, appointment) => total + appointment.value, 0),
        pendingEvolution: attended.filter((appointment) => !finalizedNoteIds.has(appointment.id)).length,
      };
    }).filter((row) => row.appointments > 0 || insuranceFilter === "Todos");
  }, [filteredAppointments, finalizedNoteIds, insuranceFilter, state.patients]);

  return (
    <main className="main-area">
      <header className="topbar">
        <div>
          <p className="page-kicker">ClinicFlow Psico · Relatórios gerenciais · {loadedAt || "carregando"}</p>
          <h1 className="page-title">Relatórios</h1>
          <p className="page-description">Indicadores consolidados a partir dos pacientes, consultas e evoluções salvos no MVP principal.</p>
        </div>
        <div className="top-actions">
          <Link className="btn btn-secondary" href="/">Voltar ao painel</Link>
          <button className="btn btn-secondary" onClick={() => window.print()}>Imprimir relatório</button>
        </div>
      </header>

      <section className="card" style={{ marginBottom: 18 }}>
        <div className="card-header">
          <div>
            <h2 className="card-title">Filtros</h2>
            <p className="card-description">Use os filtros para conferir status, convênios e pendências.</p>
          </div>
        </div>
        <div className="form-grid">
          <Field label="Status">
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "Todos" | AppointmentStatus)}>
              <option>Todos</option>
              {appointmentStatuses.map((status) => <option key={status}>{status}</option>)}
            </select>
          </Field>
          <Field label="Convênio">
            <select value={insuranceFilter} onChange={(event) => setInsuranceFilter(event.target.value)}>
              {insurances.map((insurance) => <option key={insurance}>{insurance}</option>)}
            </select>
          </Field>
        </div>
      </section>

      <section className="grid stats-grid">
        <Stat label="Consultas" value={String(filteredAppointments.length)} hint="Dentro dos filtros" />
        <Stat label="Receita prevista" value={money(totals.expected)} hint="Não canceladas" />
        <Stat label="Receita realizada" value={money(totals.realized)} hint="Atendidas" />
        <Stat label="Pendências evolução" value={String(totals.pendingEvolution)} hint="Atendidas sem evolução finalizada" />
      </section>

      <section className="grid two-column" style={{ marginTop: 18 }}>
        <div className="card">
          <div className="card-header"><div><h2 className="card-title">Consultas por status</h2><p className="card-description">Acompanhamento operacional da agenda.</p></div></div>
          <div className="table-wrap">
            <table><thead><tr><th>Status</th><th>Qtd.</th><th>Valor</th></tr></thead><tbody>{statusRows.map((row) => <tr key={row.status}><td>{row.status}</td><td>{row.total}</td><td>{money(row.value)}</td></tr>)}</tbody></table>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><div><h2 className="card-title">Resumo por convênio</h2><p className="card-description">Valor previsto por fonte pagadora.</p></div></div>
          <div className="table-wrap">
            <table><thead><tr><th>Convênio</th><th>Pacientes</th><th>Consultas</th><th>Valor</th></tr></thead><tbody>{insuranceRows.map((row) => <tr key={row.insurance}><td>{row.insurance}</td><td>{row.patients}</td><td>{row.appointments}</td><td>{money(row.value)}</td></tr>)}</tbody></table>
          </div>
        </div>
      </section>

      <section className="card" style={{ marginTop: 18 }}>
        <div className="card-header"><div><h2 className="card-title">Resumo por paciente</h2><p className="card-description">Quantidade de atendimentos, valores realizados e pendências de evolução.</p></div></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Paciente</th><th>Convênio</th><th>Consultas</th><th>Atendidas</th><th>Pend. evolução</th><th>Realizado</th></tr></thead>
            <tbody>{patientRows.map((row) => <tr key={row.patient.id}><td>{row.patient.name}</td><td>{row.patient.insurance}</td><td>{row.appointments}</td><td>{row.attended}</td><td>{row.pendingEvolution}</td><td>{money(row.value)}</td></tr>)}</tbody>
          </table>
        </div>
      </section>

      <section className="card" style={{ marginTop: 18 }}>
        <div className="card-header"><div><h2 className="card-title">Consultas detalhadas</h2><p className="card-description">Base analítica para conferência e exportação futura.</p></div></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Data</th><th>Hora</th><th>Paciente</th><th>Convênio</th><th>Status</th><th>Valor</th><th>Evolução</th></tr></thead>
            <tbody>{filteredAppointments.map((appointment) => {
              const patient = patientsById.get(appointment.patientId);
              return <tr key={appointment.id}><td>{formatDate(appointment.date)}</td><td>{appointment.time}</td><td>{patient?.name || "-"}</td><td>{patient?.insurance || "-"}</td><td>{appointment.status}</td><td>{money(appointment.value)}</td><td>{finalizedNoteIds.has(appointment.id) ? "Finalizada" : "Pendente"}</td></tr>;
            })}</tbody>
          </table>
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
