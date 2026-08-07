# Checklist para início comercial

## Pode ser apresentado comercialmente quando

- CI do PR estiver verde.
- Deploy na Vercel estiver disponível.
- Fluxo de reset estiver funcionando.
- AJB Admin conseguir bloquear e liberar licença demonstrativa.
- Secretária continuar sem acesso a financeiro, documentos, relatórios e evolução.
- Psicólogo conseguir navegar por agenda, pacientes, documentos, usuários, consultórios, auditoria, financeiro e relatórios.

## Ainda não pode operar com cliente real até concluir

- Autenticação real.
- Banco real.
- Isolamento por tenant.
- Regras de backend.
- Backup.
- Monitoramento.
- Termos de uso.
- Política de privacidade.
- Revisão LGPD.

## Rotas principais

- `/`
- `/ajb-admin`
- `/consultorios`
- `/usuarios`
- `/documentos`
- `/auditoria`
- `/financeiro`
- `/relatorios`
- `/reset`

## Critério de liberação de deploy

A branch só pode ser mergeada quando estas validações passarem:

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run test:smoke
npm run build
```
