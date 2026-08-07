"use client";

import Link from "next/link";
import { useState } from "react";
import { demoStorageKeys, resetDemoEnvironment } from "../demoReset";

export default function ResetPage() {
  const [confirmation, setConfirmation] = useState("");
  const [resetDone, setResetDone] = useState(false);
  const [removedCount, setRemovedCount] = useState(0);
  const canReset = confirmation === "RESETAR";

  function executeReset() {
    if (!canReset) return;
    const count = resetDemoEnvironment();
    setRemovedCount(count);
    setResetDone(true);
    setConfirmation("");
  }

  return (
    <main className="main-area">
      <header className="topbar">
        <div>
          <p className="page-kicker">ClinicFlow Psico · Reset controlado</p>
          <h1 className="page-title">Resetar ambiente demonstrativo</h1>
          <p className="page-description">Limpe dados locais do navegador, restaure o estado inicial da demonstração e desbloqueie a licença local quando necessário.</p>
        </div>
        <div className="top-actions"><Link className="btn btn-secondary" href="/ajb-admin">AJB Admin</Link><Link className="btn btn-secondary" href="/">Produto</Link></div>
      </header>

      <section className="grid two-column" style={{ marginTop: 18 }}>
        <div className="card">
          <div className="card-header"><div><h2 className="card-title">Confirmação obrigatória</h2><p className="card-description">Digite RESETAR para remover somente os dados locais da demonstração.</p></div></div>
          <div className="appointment-list">
            <div className="appointment-item"><div className="time-box">SAFE</div><div><p className="item-title">Reset local e reversível</p><p className="item-meta">Não remove código, commits, configuração de deploy ou dados de produção externos.</p></div></div>
            <div className="field"><label>Confirmação</label><input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Digite RESETAR" /></div>
            <button className="btn btn-primary" disabled={!canReset} onClick={executeReset}>Executar reset</button>
            {resetDone && <div className="empty-state">Reset concluído. {removedCount} grupos de dados locais foram limpos. Abra o produto para recriar a base demonstrativa inicial.</div>}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><div><h2 className="card-title">O que será limpo</h2><p className="card-description">Lista controlada de chaves locais removidas pelo reset.</p></div></div>
          <div className="appointment-list">
            {demoStorageKeys.map((item) => <div className="appointment-item" key={item.key}><div className="time-box">CLR</div><div><p className="item-title">{item.label}</p><p className="item-meta">{item.description}</p><small>{item.key}</small></div></div>)}
          </div>
        </div>
      </section>

      <section className="card" style={{ marginTop: 18 }}>
        <div className="card-header"><div><h2 className="card-title">Uso recomendado</h2><p className="card-description">Use esta tela quando a demonstração ficar poluída, quando a licença local estiver bloqueada ou antes de uma apresentação comercial.</p></div></div>
      </section>
    </main>
  );
}
