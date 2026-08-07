# Mapa atual do produto

## Área AJBNetSystems

- `/ajb-admin`
  - Clientes SaaS demonstrativos.
  - Status de licença.
  - Bloqueio/desbloqueio de usuários do cliente.
  - Auditoria das ações AJB.

## Área do consultório

- `/`
  - Dashboard, agenda, pacientes e atendimento em tela principal.

- `/consultorios`
  - Cadastro de unidades.
  - Seleção da unidade ativa.
  - Ativação/desativação.

- `/usuarios`
  - Cadastro de psicólogos e secretárias.
  - Bloqueio/desbloqueio.
  - Alteração de role.

- `/documentos`
  - Rascunhos de declaração, atestado, relatório, laudo, encaminhamento e recibo.

- `/financeiro`
  - Controle financeiro demonstrativo das consultas.

- `/relatorios`
  - Indicadores operacionais e gerenciais.

- `/auditoria`
  - Histórico das ações administrativas.

- `/reset`
  - Limpeza segura do estado local demonstrativo.

## Regras principais

- `PSICOLOGO` acessa módulos clínicos, documentos, relatórios, financeiro e gestão.
- `SECRETARIA` não acessa financeiro, documentos, relatórios, evolução, auditoria e gestão de usuários/consultórios.
- `BLOCKED` e `CANCELED` bloqueiam o ambiente do consultório.
- `/reset` permanece acessível para restaurar o MVP em caso de bloqueio local.
