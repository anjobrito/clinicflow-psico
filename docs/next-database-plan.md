# Plano de migração para banco real

## Objetivo

Substituir a persistência local por banco real com isolamento SaaS.

## Entidades mínimas

- tenants
- licenses
- clinic_units
- tenant_users
- patients
- appointments
- clinical_notes
- psychological_documents
- financial_records
- audit_entries

## Chaves obrigatórias

- tenant_id
- clinic_id
- created_by
- updated_by
- created_at
- updated_at

## Regras obrigatórias

- Todo dado operacional pertence a um tenant.
- Pacientes, consultas, documentos, financeiro e evoluções pertencem também a uma unidade quando aplicável.
- AJBNetSystems gerencia licença e bloqueio comercial.
- Psicólogo gerencia operação do consultório.
- Secretária opera agenda e dados básicos, sem dados sensíveis.

## Ordem recomendada

1. Criar schema do banco.
2. Criar funções de acesso a dados.
3. Migrar usuários e consultórios.
4. Migrar pacientes e agenda.
5. Migrar documentos e evolução.
6. Migrar financeiro.
7. Migrar auditoria.
8. Remover dependência operacional de localStorage.
