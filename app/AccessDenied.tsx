type AccessDeniedProps = {
  title?: string;
  message: string;
  actionHref?: string;
  actionLabel?: string;
};

export default function AccessDenied({ title = "Acesso restrito", message, actionHref = "/", actionLabel = "Voltar ao painel" }: AccessDeniedProps) {
  return (
    <main className="main-area">
      <section className="card" style={{ marginTop: 24 }}>
        <div className="card-header">
          <div>
            <p className="page-kicker">ClinicFlow Psico · Segurança</p>
            <h1 className="page-title">{title}</h1>
            <p className="page-description">{message}</p>
          </div>
        </div>
        <div className="appointment-list">
          <div className="appointment-item">
            <div className="time-box">!</div>
            <div>
              <p className="item-title">Permissão insuficiente</p>
              <p className="item-meta">Esta regra representa o comportamento esperado no SaaS com login real.</p>
            </div>
          </div>
          <a className="btn btn-primary" href={actionHref}>{actionLabel}</a>
        </div>
      </section>
    </main>
  );
}
