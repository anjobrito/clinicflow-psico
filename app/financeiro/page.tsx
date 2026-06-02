"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

type ChargeStatus = "Pendente" | "Pago" | "Atrasado";
type PaymentMethod = "Pix" | "Dinheiro" | "Cartão" | "Convênio";

type Patient = {
  id: string;
  name: string;
  payer: string;
  insurance: string;
};

type Session = {
  id: string;
  patientId: string;
  date: string;
  time: string;
  status: "Atendida" | "Agendada" | "Cancelada";
  value: number;
};

type Charge = {
  id: string;
  sessionId: string;
  patientId: string;
  dueDate: string;
  amount: number;
  status: ChargeStatus;
  method: PaymentMethod;
  paidAt: string;
  notes: string;
};

type FinancialState = {
  patients: Patient[];
  sessions: Session[];
  charges: Charge[];
};

const today = new Date().toISOString().slice(0, 10);
const storageKey = "clinicflow-psico-financial-flow-v1";

const initialState: FinancialState = {
  patients: [
    { id: "p1", name: "Mariana Oliveira", payer: "Mariana Oliveira", insurance: "Particular" },
    { id: "p2", name: "Carlos Mendes", payer: "UNIMED", insurance: "UNIMED" },
  ],
  sessions: [
    { id: "s1", patientId: "p1", date: today, time: "09:00", status: "Atendida", value: 180 },
    { id: "s2", patientId: "p2", date: today, time: "11:00", status: "Atendida", value: 140 },
  ],
  charges: [
    { id: "c1", sessionId: "s1", patientId: "p1", dueDate: today, amount: 180, status: "Pendente", method: "Pix", paidAt: "", notes: "Gerado ao finalizar atendimento." },
    { id: "c2", sessionId: "s2", patientId: "p2", dueDate: today, amount: 140, status: "Pendente", method: "Convênio", paidAt: "", notes: "Enviar para fechamento do convênio." },
  ],
};

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function loadState(): FinancialState {
  if (typeof window === "undefined") return initialState;
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return initialState;

  try {
    const parsed = JSON.parse(raw) as FinancialState;
    return {
      patients: Array.isArray(parsed.patients) ? parsed.patients : initialState.patients,
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : initialState.sessions,
      charges: Array.isArray(parsed.charges) ? parsed.charges : initialState.charges,
    };
  } catch {
    return initialState;
  }
}

export default function FinancialProcessPage() {
  const [state, setState] = useState<FinancialState>(initialState);
  const [loaded, setLoaded] = useState(false);
  const [sessionForm, setSessionForm] = useState({ patientId: "p1", date: today, time: "14:00", value: "180" });
  const [chargeNote, setChargeNote] = useState("");

  useEffect(() => {
    setState(loadState());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  }, [loaded, state]);

  const totals = useMemo(() => {
    const expected = state.charges.reduce((total, charge) => total + charge.amount, 0);
    const paid = state.charges.filter((charge) => charge.status === "Pago").reduce((total, charge) => total + charge.amount, 0);
    const pending = state.charges.filter((charge) => charge.status !== "Pago").reduce((total, charge) => total + charge.amount, 0);
    return { expected, paid, pending };
  }, [state.charges]);

  function patientName(patientId: string) {
    return state.patients.find((patient) => patient.id === patientId)?.name || "Paciente não encontrado";
  }

  function createAttendedSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const session: Session = {
      id: createId("s"),
      patientId: sessionForm.patientId,
      date: sessionForm.date,
      time: sessionForm.time,
      status: "Atendida",
      value: Number(sessionForm.value || 0),
    };

    const charge: Charge = {
      id: createId("c"),
      sessionId: session.id,
      patientId: session.patientId,
      dueDate: session.date,
      amount: session.value,
      status: "Pendente",
      method: state.patients.find((patient) => patient.id === session.patientId)?.insurance === "Particular" ? "Pix" : "Convênio",
      paidAt: "",
      notes: chargeNote || "Cobrança gerada automaticamente a partir de sessão atendida.",
    };

    setState((current) => ({
      ...current,
      sessions: [session, ...current.sessions],
      charges: [charge, ...current.charges],
    }));
    setChargeNote("");
  }

  function updateChargeStatus(charge: Charge, status: ChargeStatus) {
    setState((current) => ({
      ...current,
      charges: current.charges.map((item) =>
        item.id === charge.id
          ? { ...item, status, paidAt: status === "Pago" ? new Date().toISOString().slice(0, 10) : "" }
          : item
      ),
    }));
  }

  function resetFinancialFlow() {
    if (!window.confirm("Restaurar demonstração financeira?")) return;
    window.localStorage.removeItem(storageKey);
    setState(initialState);
  }

  return (
    <main className="main-area">
      <header className="topbar">
        <div>
          <p className="page-kicker">ClinicFlow Psico · Processo financeiro</p>
          <h1 className="page-title">Atendimento → Cobrança → Pagamento → Relatório</h1>
          <p className="page-description">Fluxo completo para validar o financeiro que nasce do atendimento finalizado.</p>
        </div>
        <div className="top-actions">
          <Link className="btn btn-secondary" href="/">Voltar</Link>
          <button className="btn btn-secondary" onClick={resetFinancialFlow}>Restaurar demo</button>
        </div>
      </header>

      <section className="grid stats-grid">
        <Stat label="Previsto" value={money(totals.expected)} hint="Cobranças geradas" />
        <Stat label="Recebido" value={money(totals.paid)} hint="Pagamentos confirmados" />
        <Stat label="Pendente" value={money(totals.pending)} hint="Ainda em aberto" />
        <Stat label="Cobranças" value={String(state.charges.length)} hint="Total no período" />
      </section>

      <section className="grid two-column" style={{ marginTop: 18 }}>
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">1. Atendimento realizado</h2>
              <p className="card-description">Simula uma sessão finalizada e gera cobrança automaticamente.</p>
            </div>
          </div>
          <form className="form-grid" onSubmit={createAttendedSession}>
            <Field label="Paciente">
              <select value={sessionForm.patientId} onChange={(event) => setSessionForm({ ...sessionForm, patientId: event.target.value })}>
                {state.patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name} · {patient.insurance}</option>)}
              </select>
            </Field>
            <Field label="Data"><input type="date" value={sessionForm.date} onChange={(event) => setSessionForm({ ...sessionForm, date: event.target.value })} /></Field>
            <Field label="Hora"><input type="time" value={sessionForm.time} onChange={(event) => setSessionForm({ ...sessionForm, time: event.target.value })} /></Field>
            <Field label="Valor"><input value={sessionForm.value} onChange={(event) => setSessionForm({ ...sessionForm, value: event.target.value })} /></Field>
            <Field label="Observação"><textarea value={chargeNote} onChange={(event) => setChargeNote(event.target.value)} /></Field>
            <div className="field full"><button className="btn btn-primary">Finalizar atendimento e gerar cobrança</button></div>
          </form>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">2. Cobranças geradas</h2>
              <p className="card-description">Controle o recebimento de particular e convênio.</p>
            </div>
          </div>
          <div className="appointment-list">
            {state.charges.map((charge) => (
              <div className="appointment-item" key={charge.id}>
                <div className="time-box">{money(charge.amount)}</div>
                <div>
                  <p className="item-title">{patientName(charge.patientId)}</p>
                  <p className="item-meta">Vencimento: {charge.dueDate} · Método: {charge.method} · Pago em: {charge.paidAt || "-"}</p>
                  <p className="item-meta">{charge.notes}</p>
                </div>
                <div className="top-actions">
                  <span className={charge.status === "Pago" ? "badge badge-green" : "badge badge-yellow"}>{charge.status}</span>
                  <select value={charge.status} onChange={(event) => updateChargeStatus(charge, event.target.value as ChargeStatus)}>
                    <option>Pendente</option>
                    <option>Pago</option>
                    <option>Atrasado</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="card" style={{ marginTop: 18 }}>
        <div className="card-header">
          <div>
            <h2 className="card-title">3. Relatório financeiro do processo</h2>
            <p className="card-description">Resumo consolidado do previsto, recebido e pendente.</p>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Paciente</th><th>Vencimento</th><th>Método</th><th>Status</th><th>Valor</th></tr></thead>
            <tbody>
              {state.charges.map((charge) => (
                <tr key={charge.id}>
                  <td>{patientName(charge.patientId)}</td>
                  <td>{charge.dueDate}</td>
                  <td>{charge.method}</td>
                  <td>{charge.status}</td>
                  <td>{money(charge.amount)}</td>
                </tr>
              ))}
            </tbody>
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
