# Análise de gaps de segurança

## Controles já demonstrados

- Bloqueio por licença.
- Restrição visual por role.
- Auditoria local.
- Reset local seguro.
- Separação entre AJB Admin e área do consultório.

## Gaps antes de cliente real

- Falta autenticação real.
- Falta autorização no servidor.
- Falta isolamento persistente por tenant.
- Falta criptografia/segurança de dados sensíveis no backend.
- Falta trilha de auditoria persistente.
- Falta política de retenção.
- Falta backup.
- Falta logs de acesso.
- Falta política LGPD.

## Recomendação

Não usar com dados reais de pacientes até concluir backend, banco, autenticação, tenant isolation e LGPD.
