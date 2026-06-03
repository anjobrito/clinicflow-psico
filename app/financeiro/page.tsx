"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type AppointmentStatus = "Agendada" | "Confirmada" | "Em atendimento" | "Atendida" | "Faltou" | "Cancelada" | "Remarcada";
type ChargeStatus = "Pendente" | "Pago" | "Atrasado" | "Cancelado";
type PaymentMethod = "Pix" | "Dinheiro" | "Cartão" | "Convênio";

type Patient = { id: string; name: string; phone: string; insurance: string; status: string; value: number };
type Appointment = { id: string; patientId: string; date: string; time: string; duration: number; professional: string; room: string; mode: string; status: AppointmentStatus; value: number };
type Note = { appointmentId: string; content: string; finalized: boolean; updatedAt: string };
type MvpState = { patients: Patient[]; appointments: Appointment[]; notes: Note[] };
type Payment = { appointmentId: string; status: ChargeStatus; method: PaymentMethod; paidAt: string; observation: string };

const mvpStorageKey = "clinicflow-psico-mvp-state-v1";
const paymentStorageKey = "clinicflow-psico-payments-v1";

const fallbackState: MvpState = { patients: [], appointments: [], notes: [] };

function money(value: number) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value); }
function formatDate(value: string) { if (!value) return "-"; const [year, month, day] = value.split("-"); return `${day}/${month}/${year}`; }
function todayIso() { return new Date().toISOString().slice(0, 10); }

function loadMvpState(): MvpState {
  if (typeof window === "undefined") return fallbackState;
  const raw = window.localStorage.getItem(mvpStorageKey);
  if (!raw) return fallbackState;
  try {
    const parsed = JSON.parse(raw) as Partial<MvpState>;
    return { patients: Array.isArray(parsed.patients) ? parsed.patients : [], appointments: Array.isArray(parsed.appointments) ? parsed.appointments : [], notes: Array.isArray(parsed.notes) ? parsed.notes : [] };
  } catch { return fallbackState; }
}

function loadPayments(): Payment[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(paymentStorageKey);
  if (!raw) return [];
  try { const parsed = JSON.parse(raw) as Payment[]; return Array.isArray(parsed) ? parsed : []; } catch { return []; }
}

export default function FinancePage() {
  const [mvpState, setMvpState] = useState<MvpState>(fallbackState);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"Todos" | ChargeStatus>("Todos");
  const [insuranceFilter, setInsuranceFilter] = useState("Todos");
  const [loadedAt, setLoadedAt] = useState("");

  useEffect(() => {
    setMvpState(loadMvpState());
    setPayments(loadPayments());
    setLoadedAt(new Date().toLocaleString("pt-BR"));
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    window.localStorage.setItem(paymentStorageKey, JSON.stringify(payments));
  }, [loaded, payments]);

  const patientsById = useMemo(() => new Map(mvpState.patients.map((patient) => [patient.id, patient])), [mvpState.patients]);
  const paymentsByAppointment = useMemo(() => new Map(payments.map((payment) => [payment.appointmentId, payment])), [payments]);
  const insurances = useMemo(() => ["Todos", ...Array.from(new Set(mvpState.patients.map((patient) => patient.insurance)))], [mvpState.patients]);

  const charges = useMemo(() => {
    return mvpState.appointments
      .filter((appointment) => appointment.status !== "Cancelada")
      .map((appointment) => {
        const patient = patientsById.get(appointment.patientId);
        const saved = paymentsByAppointment.get(appointment.id);
        const status: ChargeStatus = saved?.status || (appointment.status === "Atendida" ? "Pendente" : "Pendente");
        const method: PaymentMethod = saved?.method || (patient?.insurance === "Particular" ? "Pix" : "Convênio");
        return { appointment, patient, status, method, paidAt: saved?.paidAt || "", observation: saved?.observation || "" };
      })
      .filter((charge) => (statusFilter === "Todos" || charge.status === statusFilter) && (insuranceFilter === "Todos" || charge.patient?.insurance === insuranceFilter));
  }, [insuranceFilter, mvpState.appointments, patientsById, paymentsByAppointment, statusFilter]);

  const totals = useMemo(() => {
    const expected = charges.reduce((total, charge) => total + charge.appointment.value, 0);
    const received = charges.filter((charge) => charge.status === "Pago").reduce((total, charge) => total + charge.appointment.value, 0);
    const pending = charges.filter((charge) => charge.status !== "Pago").reduce((total, charge) => total + charge.appointment.value, 0);
    const attendedPending = charges.filter((charge) => charge.appointment.status === "Atendida" && charge.status !== "Pago").length;
    return { expected, received, pending, attendedPending };
  }, [charges]);

  const byInsurance = useMemo(() => {
    return Array.from(new Set(charges.map((charge) => charge.patient?.insurance || "Sem convênio"))).map((insurance) => {
      const rows = charges.filter((charge) => (charge.patient?.insurance || "Sem convênio") === insurance);
      return { insurance, total: rows.length, expected: rows.reduce((sum, row) => sum + row.appointment.value, 0), received: rows.filter((row) => row.status === "Pago").reduce((sum, row) => sum + row.appointment.value, 0) };
    });
  }, [charges]);

  function upsertPayment(appointmentId: string, patch: Partial<Payment>) {
    setPayments((current) => {
      const existing = current.find((payment) => payment.appointmentId === appointmentId);
      if (existing) return current.map((payment) => payment.appointmentId === appointmentId ? { ...payment, ...patch } : payment);
      return [{ appointmentId, status: "Pendente", method: "Pix", paidAt: "", observation: "", ...patch }, ...current];
    });
  }

  function confirmPayment(appointmentId: string) {
    const current = paymentsByAppointment.get(appointmentId);
    upsertPayment(appointmentId, { status: "Pago", paidAt: todayIso(), method: current?.method || "Pix" });
  }

  function refreshFromMvp() {
    setMvpState(loadMvpState());
    setLoadedAt(new Date().toLocaleString("pt-BR"));
  }

  return (
    <main className="main-area">
      <header className="topbar">
        <div>
          <p className="page-kicker">ClinicFlow Psico · Financeiro integrado · {loadedAt || "carregando"}</p>
          <h1 className="page-title">Financeiro</h1>
          <p className="page-description">Cobranças geradas a partir das consultas reais do MVP principal, com controle de pagamento e resumo por convênio.</p>
        </div>
        <div className="top-actions"><Link className="btn btn-secondary" href="/">Voltar ao painel</Link><button className="btn btn-secondary" onClick={refreshFromMvp}>Atualizar dados</button><button className="btn btn-secondary" onClick={() => window.print()}>Imprimir</button></div>
      </header>

      <section className="card" style={{ marginBottom: 18 }}>
        <div className="card-header"><div><h2 className="card-title">Filtros</h2><p className="card-description">Filtre por pagamento e convênio para conferência financeira.</p></div></div>
        <div className="form-grid">
          <Field label="Status financeiro"><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "Todos" | ChargeStatus)}><option>Todos</option><option>Pendente</option><option>Pago</option><option>Atrasado</option><option>Cancelado</option></select></Field>
          <Field label="Convênio"><select value={insuranceFilter} onChange={(event) => setInsuranceFilter(event.target.value)}>{insurances.map((insurance) => <option key={insurance}>{insurance}</option>)}</select></Field>
        </div>
      </section>

      <section className="grid stats-grid">
        <Stat label="Previsto" value={money(totals.expected)} hint="Consultas não canceladas" />
        <Stat label="Recebido" value={money(totals.received)} hint="Pagamentos confirmados" />
        <Stat label="Pendente" value={money(totals.pending)} hint="Ainda em aberto" />
        <Stat label="Atendidas pendentes" value={String(totals.attendedPending)} hint="Sessões feitas sem baixa" />
      </section>

      <section className="grid two-column" style={{ marginTop: 18 }}>
        <div className="card">
          <div className="card-header"><div><h2 className="card-title">Cobranças</h2><p className="card-description">Baixe pagamentos diretamente a partir das consultas.</p></div></div>
          <div className="appointment-list">
            {charges.length === 0 ? <div className="empty-state">Nenhuma cobrança encontrada. Cadastre consultas no painel principal.</div> : charges.map((charge) => (
              <div className="appointment-item" key={charge.appointment.id}>
                <div className="time-box">{money(charge.appointment.value)}</div>
                <div><p className="item-title">{charge.patient?.name || "Paciente não encontrado"}</p><p className="item-meta">{formatDate(charge.appointment.date)} · {charge.appointment.time} · Consulta: {charge.appointment.status} · {charge.patient?.insurance || "-"}</p><p className="item-meta">Pago em: {charge.paidAt || "-"}</p></div>
                <div className="top-actions"><span className={charge.status === "Pago" ? "badge badge-green" : "badge badge-yellow"}>{charge.status}</span><select value={charge.method} onChange={(event) => upsertPayment(charge.appointment.id, { method: event.target.value as PaymentMethod })}><option>Pix</option><option>Dinheiro</option><option>Cartão</option><option>Convênio</option></select><select value={charge.status} onChange={(event) => upsertPayment(charge.appointment.id, { status: event.target.value as ChargeStatus, paidAt: event.target.value === "Pago" ? todayIso() : "" })}><option>Pendente</option><option>Pago</option><option>Atrasado</option><option>Cancelado</option></select><button className="btn btn-secondary" onClick={() => confirmPayment(charge.appointment.id)}>Confirmar</button></div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><div><h2 className="card-title">Resumo por convênio</h2><p className="card-description">Previsto e recebido por fonte pagadora.</p></div></div>
          <div className="table-wrap"><table><thead><tr><th>Convênio</th><th>Cobranças</th><th>Previsto</th><th>Recebido</th></tr></thead><tbody>{byInsurance.map((row) => <tr key={row.insurance}><td>{row.insurance}</td><td>{row.total}</td><td>{money(row.expected)}</td><td>{money(row.received)}</td></tr>)}</tbody></table></div>
        </div>
      </section>

      <section className="card" style={{ marginTop: 18 }}>
        <div className="card-header"><div><h2 className="card-title">Conferência analítica</h2><p className="card-description">Base para fechamento mensal e exportação futura.</p></div></div>
        <div className="table-wrap"><table><thead><tr><th>Data</th><th>Paciente</th><th>Convênio</th><th>Consulta</th><th>Financeiro</th><th>Método</th><th>Valor</th></tr></thead><tbody>{charges.map((charge) => <tr key={charge.appointment.id}><td>{formatDate(charge.appointment.date)}</td><td>{charge.patient?.name || "-"}</td><td>{charge.patient?.insurance || "-"}</td><td>{charge.appointment.status}</td><td>{charge.status}</td><td>{charge.method}</td><td>{money(charge.appointment.value)}</td></tr>)}</tbody></table></div>
      </section>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="field"><label>{label}</label>{children}</div>; }
function Stat({ label, value, hint }: { label: string; value: string; hint: string }) { return <div className="card stat-card"><p className="stat-label">{label}</p><p className="stat-value">{value}</p><p className="stat-hint">{hint}</p></div>; }
