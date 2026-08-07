# Runbook de reset demonstrativo

## Objetivo

Permitir limpar rapidamente o estado local do MVP antes de uma demonstração ou quando a licença local estiver bloqueada.

## Rota

`/reset`

## Procedimento

1. Abrir `/reset`.
2. Digitar `RESETAR` no campo de confirmação.
3. Clicar em `Executar reset`.
4. Abrir `/` para recriar a base demonstrativa inicial.

## Dados removidos

- Agenda, pacientes e evoluções.
- Financeiro demonstrativo.
- Documentos psicológicos locais.
- Usuários do consultório.
- Auditoria local.
- Consultórios/unidades locais.
- Unidade ativa.
- Perfil demonstrativo.
- Status local da licença.

## Segurança

O reset remove apenas dados do navegador local. Ele não altera código, commits, deploy, banco externo ou configurações da Vercel.

## Quando usar

- Antes de apresentar para cliente.
- Depois de testar bloqueio de licença.
- Quando a base local ficar poluída.
- Quando for necessário voltar ao estado inicial do MVP.
