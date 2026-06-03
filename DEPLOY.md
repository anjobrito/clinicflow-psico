# ClinicFlow Psico - Publicacao rapida

## Objetivo
Publicar rapidamente um MVP demonstravel para validacao comercial em consultorios.

## Status atual do MVP
- Dashboard funcional
- Agenda funcional
- Pacientes no painel principal
- Atendimento com evolucao em rascunho/finalizacao
- Relatorios gerenciais
- Financeiro integrado as consultas
- Persistencia local via localStorage

## Deploy recomendado
Vercel com importacao direta do repositorio GitHub.

## Configuracao Vercel
- Framework: Next.js
- Build command: npm run build
- Install command: npm install
- Output directory: padrao do Next.js
- Branch: main

## Validacao antes de apresentar
1. Abrir o painel principal.
2. Cadastrar paciente de demonstracao.
3. Criar consulta.
4. Alterar consulta para Atendida.
5. Abrir atendimento e finalizar evolucao.
6. Abrir Relatorios e validar indicadores.
7. Abrir Financeiro e confirmar pagamento.
8. Atualizar a pagina e confirmar persistencia local.

## Aviso comercial importante
Este MVP usa localStorage. Isso e adequado para demonstracao e piloto local, mas nao para uso multiusuario real.

Para uso comercial definitivo, migrar para:
- Prisma
- PostgreSQL
- Autenticacao
- Perfis de acesso
- LGPD/auditoria
- Backup
