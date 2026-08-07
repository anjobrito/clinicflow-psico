# Arquitetura alvo de backend

## Objetivo

Transformar o MVP visual em SaaS operacional com dados reais e isolamento entre clientes.

## Componentes

- Autenticação.
- Banco relacional.
- Camada de autorização.
- Serviços de domínio.
- Auditoria persistente.
- Controle de licença.
- Observabilidade.

## Domínios

- AJBNetSystems Admin.
- Tenant/cliente SaaS.
- Consultório/unidade.
- Usuário e role.
- Paciente.
- Agenda.
- Evolução clínica.
- Documento psicológico.
- Financeiro.
- Auditoria.

## Regra de ouro

Nenhuma regra crítica deve depender apenas do front-end. Bloqueio de licença, acesso da secretária e isolamento de tenant devem ser validados no backend.
