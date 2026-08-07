# ClinicFlow Psico — Roadmap de finalização comercial

## Estratégia de entrega

O produto será finalizado em ciclos fechados de entrega. Cada ciclo precisa passar por CI antes de merge e deploy.

Validações obrigatórias:

1. Lint
2. TypeScript
3. Unit tests
4. Smoke tests
5. Production build
6. Deploy Vercel
7. Revisão visual final

## Estado atual do MVP

O sistema já possui módulos demonstrativos para:

- agenda, pacientes e evolução clínica;
- financeiro;
- relatórios;
- documentos psicológicos;
- usuários do consultório;
- auditoria;
- multi-consultório;
- administração AJBNetSystems;
- licença demonstrativa;
- reset seguro do ambiente local.

A persistência atual ainda é localStorage. Isso é aceitável para validação visual e apresentação, mas não para operação comercial com clientes reais.

## Próximas fases para uso comercial

### Fase 1 — Estabilização do MVP demonstrável

- Manter CI verde.
- Padronizar reset seguro.
- Garantir que secretária não acesse financeiro, evolução, documentos e relatórios.
- Garantir que AJBNetSystems bloqueie/desbloqueie licença.
- Garantir que multi-consultório esteja navegável.

### Fase 2 — Banco real e isolamento SaaS

- Criar modelo de dados definitivo.
- Migrar dados do localStorage para banco.
- Separar tenant, consultório, usuário, paciente, agenda, evolução, documento, financeiro e auditoria.
- Aplicar isolamento por tenant e clinic_id.

### Fase 3 — Autenticação e autorização real

- Login real.
- Papéis: AJB_ADMIN, TENANT_OWNER, PSICOLOGO, SECRETARIA.
- Bloqueio de usuário no servidor.
- Bloqueio de licença no servidor.
- Rotas protegidas.
- Políticas de acesso no backend.

### Fase 4 — Operação clínica pronta

- Agenda por consultório.
- Pacientes vinculados à unidade.
- Evolução clínica protegida.
- Documentos vinculados ao paciente e ao profissional.
- Financeiro por consulta, paciente, convênio e unidade.
- Relatórios por consultório e consolidado do cliente.

### Fase 5 — Comercialização

- Deploy estável.
- Domínio final.
- Política de backup.
- Logs e monitoramento.
- Onboarding do cliente.
- Termos de uso e política de privacidade.
- Plano de suporte.

## Comparação com uma versão Java tradicional

Sem o código-fonte da versão Java dentro deste repositório, a comparação abaixo é arquitetural e funcional.

| Tema | Versão Java tradicional | ClinicFlow Psico SaaS Next.js |
| --- | --- | --- |
| Interface | Normalmente server-rendered ou desktop/web monolítico | Interface SPA/Next.js responsiva |
| Deploy | Servidor de aplicação, WAR/JAR, VM ou container | Vercel com pipeline GitHub |
| Multiempresa | Geralmente depende de modelagem e filtros por empresa | Roadmap define tenant + clinic_id desde a base |
| Autorização | Spring Security, filtros ou interceptors | RBAC em camada de app e backend futuro |
| Banco | JPA/Hibernate/PostgreSQL/MySQL | Banco real ainda pendente; MVP usa localStorage |
| Auditoria | Tabelas auditáveis ou listeners JPA | Auditoria local já demonstrada; banco pendente |
| Escalabilidade | Escala por JVM/container | Escala via plataforma serverless/edge, dependendo da arquitetura final |
| Comercialização SaaS | Requer empacotar tenancy, billing e deploy | AJB Admin e licenças já modelados no produto |

## Critério de pronto comercial

O produto só deve ser vendido para operação real quando:

- autenticação real estiver ativa;
- dados estiverem em banco seguro;
- isolamento por cliente estiver implementado;
- permissões forem aplicadas no backend;
- CI estiver obrigatório;
- deploy estiver estável;
- backup e monitoramento estiverem definidos;
- LGPD, privacidade e termos estiverem preparados.
