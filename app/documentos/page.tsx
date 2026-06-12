"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import AccessDenied from "../AccessDenied";
import { can } from "../accessControl";
import { ClientRole, getStoredClientRole } from "../clientSession";

type DocumentType = "DECLARACAO" | "ATESTADO" | "RELATORIO" | "LAUDO" | "ENCAMINHAMENTO" | "RECIBO";
type DocumentStatus = "RASCUNHO" | "EM_REVISAO" | "EMITIDO";
type Patient = { id: string; name: string; phone: string; insurance: string; status: string; value: number };
type Appointment = { id: string; patientId: string; date: string; time: string; duration: number; professional: string; room: string; mode: string; status: string; value: number };
type MvpState = { patients: Patient[]; appointments: Appointment[]; notes: unknown[] };
type PsychDocument = { id: string; type: DocumentType; status: DocumentStatus; patientId: string; title: string; content: string; createdAt: string; issuedAt?: string };

const mvpStorageKey = "clinicflow-psico-mvp-state-v1";
const docsStorageKey = "clinicflow-psico-documents-v1";
const fallbackState: MvpState = { patients: [], appointments: [], notes: [] };

const documentTypeLabels: Record<DocumentType, string> = {
  DECLARACAO: "Declaração",
  ATESTADO: "Atestado psicológico",
  RELATORIO: "Relatório psicológico",
  LAUDO: "Laudo psicológico",
  ENCAMINHAMENTO: "Encaminhamento",
  RECIBO: "Recibo / Receita Saúde",
};

function loadMvpState(): MvpState {
  if (typeof window === "undefined") return fallbackState;
  const raw = window.localStorage.getItem(mvpStorageKey);
  if (!raw) return fallbackState;
  try {
    const parsed = JSON.parse(raw) as Partial<MvpState>;
    return { patients: Array.isArray(parsed.patients) ? parsed.patients : [], appointments: Array.isArray(parsed.appointments) ? parsed.appointments : [], notes: Array.isArray(parsed.notes) ? parsed.notes : [] };
  } catch { return fallbackState; }
}

function loadDocuments(): PsychDocument[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(docsStorageKey);
  if (!raw) return [];
  try { const parsed = JSON.parse(raw) as PsychDocument[]; return Array.isArray(parsed) ? parsed : []; } catch { return []; }
}

function buildTemplate(type: DocumentType, patientName: string) {
  if (type === "DECLARACAO") return `Declaro, para os devidos fins, que ${patientName} encontra-se em acompanhamento psicológico nesta clínica.\n\nEste documento deve ser revisado e assinado pelo psicólogo responsável antes da emissão.`;
  if (type === "ATESTADO") return `Atesto, para os devidos fins, que ${patientName} foi atendido(a) nesta data.\n\nCampo para justificativa técnica, período recomendado e identificação profissional.\n\nA emissão deve seguir as normas profissionais aplicáveis.`;
  if (type === "RELATORIO") return `Relatório psicológico de ${patientName}.\n\n1. Identificação\n2. Demanda\n3. Procedimentos realizados\n4. Análise técnica\n5. Encaminhamentos ou recomendações\n\nRevisão obrigatória pelo psicólogo responsável.`;
  if (type === "LAUDO") return `Laudo psicológico de ${patientName}.\n\n1. Identificação\n2. Descrição da demanda\n3. Procedimentos\n4. Análise\n5. Conclusão\n\nUso restrito e dependente de avaliação técnica formal.`;
  if (type === "ENCAMINHAMENTO") return `Encaminho ${patientName} para avaliação/acompanhamento complementar com profissional de saúde.\n\nMotivo do encaminhamento:\n\nObservações clínicas pertinentes:\n\nAssinatura do psicólogo responsável.`;
  return `Recibo referente a serviço psicológico prestado a ${patientName}.\n\nValor:\nData do atendimento:\nForma de pagamento:\nProfissional responsável:\n\nEmitir conforme orientação fiscal vigente.`;
}

export default function DocumentsPage() {
  const [role, setRole] = useState<ClientRole>("PSICOLOGO");
  const [mvpState, setMvpState] = useState<MvpState>(fallbackState);
  const [documents, setDocuments] = useState<PsychDocument[]>([]);
  const [type, setType] = useState<DocumentType>("DECLARACAO");
  const [patientId, setPatientId] = useState("");
  const [content, setContent] = useState("");
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    const loadedState = loadMvpState();
    const loadedDocs = loadDocuments();
    setRole(getStoredClientRole());
    setMvpState(loadedState);
    setDocuments(loadedDocs);
    const firstPatientId = loadedState.patients[0]?.id || "";
    setPatientId(firstPatientId);
    setContent(buildTemplate("DECLARACAO", loadedState.patients[0]?.name || "Paciente"));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(docsStorageKey, JSON.stringify(documents));
  }, [documents]);

  const patientsById = useMemo(() => new Map(mvpState.patients.map((patient) => [patient.id, patient])), [mvpState.patients]);
  const selectedPatient = patientsById.get(patientId);
  const totals = useMemo(() => ({ drafts: documents.filter((doc) => doc.status === "RASCUNHO").length, review: documents.filter((doc) => doc.status === "EM_REVISAO").length, issued: documents.filter((doc) => doc.status === "EMITIDO").length }), [documents]);

  function refreshTemplate(nextType = type, nextPatientId = patientId) {
    const patient = patientsById.get(nextPatientId);
    setContent(buildTemplate(nextType, patient?.name || "Paciente"));
  }

  function createDocument(event: FormEvent) {
    event.preventDefault();
    if (!patientId) return alert("Selecione um paciente.");
    const document: PsychDocument = { id: `doc-${Date.now()}`, type, status: "RASCUNHO", patientId, title: documentTypeLabels[type], content, createdAt: new Date().toISOString() };
    setDocuments((current) => [document, ...current]);
    setSelectedId(document.id);
  }

  function updateStatus(id: string, status: DocumentStatus) {
    setDocuments((current) => current.map((doc) => doc.id === id ? { ...doc, status, issuedAt: status === "EMITIDO" ? new Date().toISOString() : doc.issuedAt } : doc));
  }

  function openDocument(doc: PsychDocument) {
    setSelectedId(doc.id);
    setType(doc.type);
    setPatientId(doc.patientId);
    setContent(doc.content);
  }

  if (!can(role, "documents:read")) {
    return <AccessDenied message="Seu perfil de secretária não possui acesso aos documentos psicológicos do paciente." />;
  }

  return <main className="main-area"><header className="topbar"><div><p className="page-kicker">ClinicFlow Psico · Documentos</p><h1 className="page-title">Documentos psicológicos</h1><p className="page-description">Rascunhos controlados para declaração, atestado, relatório, laudo, encaminhamento e recibo. A emissão exige revisão do psicólogo responsável.</p></div><div className="top-actions"><Link className="btn btn-secondary" href="/">Voltar ao painel</Link><button className="btn btn-secondary" onClick={() => window.print()}>Imprimir</button></div></header><section className="grid stats-grid"><Stat label="Rascunhos" value={String(totals.drafts)} hint="Em elaboração" /><Stat label="Em revisão" value={String(totals.review)} hint="Aguardando validação" /><Stat label="Emitidos" value={String(totals.issued)} hint="Documentos finalizados" /><Stat label="Pacientes" value={String(mvpState.patients.length)} hint="Base local" /></section><section className="grid two-column" style={{ marginTop: 18 }}><div className="card"><div className="card-header"><div><h2 className="card-title">Novo documento</h2><p className="card-description">Selecione o paciente e o tipo. O texto gerado é apenas um rascunho técnico.</p></div></div><form className="form-grid" onSubmit={createDocument}><Field label="Paciente"><select value={patientId} onChange={(event) => { setPatientId(event.target.value); refreshTemplate(type, event.target.value); }}>{mvpState.patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name}</option>)}</select></Field><Field label="Tipo"><select value={type} onChange={(event) => { const nextType = event.target.value as DocumentType; setType(nextType); refreshTemplate(nextType, patientId); }}><option value="DECLARACAO">Declaração</option><option value="ATESTADO">Atestado psicológico</option><option value="RELATORIO">Relatório psicológico</option><option value="LAUDO">Laudo psicológico</option><option value="ENCAMINHAMENTO">Encaminhamento</option><option value="RECIBO">Recibo / Receita Saúde</option></select></Field><div className="field full"><label>Conteúdo</label><textarea className="editor" value={content} onChange={(event) => setContent(event.target.value)} /></div><div className="field full"><button className="btn btn-primary">Salvar rascunho</button></div></form></div><div className="card"><div className="card-header"><div><h2 className="card-title">Documento selecionado</h2><p className="card-description">Controle de status e emissão.</p></div></div>{selectedId ? documents.filter((doc) => doc.id === selectedId).map((doc) => <div className="appointment-list" key={doc.id}><div className="appointment-item"><div className="time-box">DOC</div><div><p className="item-title">{doc.title}</p><p className="item-meta">Paciente: {patientsById.get(doc.patientId)?.name || "-"}</p><p className="item-meta">Status: {doc.status}</p></div></div><div className="top-actions"><button className="btn btn-secondary" onClick={() => updateStatus(doc.id, "EM_REVISAO")}>Enviar para revisão</button><button className="btn btn-primary" onClick={() => updateStatus(doc.id, "EMITIDO")}>Marcar como emitido</button></div></div>) : <div className="empty-state">Selecione ou crie um documento.</div>}</div></section><section className="card" style={{ marginTop: 18 }}><div className="card-header"><div><h2 className="card-title">Histórico de documentos</h2><p className="card-description">Persistência local para validação do fluxo antes do banco definitivo.</p></div></div><div className="table-wrap"><table><thead><tr><th>Tipo</th><th>Paciente</th><th>Status</th><th>Criado em</th><th>Ação</th></tr></thead><tbody>{documents.map((doc) => <tr key={doc.id}><td>{documentTypeLabels[doc.type]}</td><td>{patientsById.get(doc.patientId)?.name || "-"}</td><td>{doc.status}</td><td>{new Date(doc.createdAt).toLocaleString("pt-BR")}</td><td><button className="btn btn-secondary" onClick={() => openDocument(doc)}>Abrir</button></td></tr>)}</tbody></table></div></section><section className="card" style={{ marginTop: 18 }}><div className="card-header"><div><h2 className="card-title">Observação de conformidade</h2><p className="card-description">Este módulo não substitui a responsabilidade técnica do psicólogo. O sistema organiza rascunhos, status, histórico e emissão controlada; o conteúdo final deve ser revisado pelo profissional habilitado.</p></div></div></section></main>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="field"><label>{label}</label>{children}</div>; }
function Stat({ label, value, hint }: { label: string; value: string; hint: string }) { return <div className="card stat-card"><p className="stat-label">{label}</p><p className="stat-value">{value}</p><p className="stat-hint">{hint}</p></div>; }
