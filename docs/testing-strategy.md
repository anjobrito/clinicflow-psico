# Estratégia de testes

## Testes atuais

- Lint
- TypeScript
- Unit checks
- Smoke checks
- Production build

## Unit checks atuais

Validam:

- chaves cobertas pelo reset;
- rota `/reset` fora do bloqueio de licença;
- presença do reset no menu;
- matriz de permissões mantendo restrições da secretária.

## Smoke checks atuais

Validam:

- existência das rotas principais;
- módulo de documentos;
- módulo de usuários;
- módulo de consultórios;
- módulo de auditoria;
- bloqueio de licença;
- integração do AJB Admin;
- reset demonstrativo.

## Próximos testes necessários

- Testes reais de componentes.
- Testes de fluxo com navegador.
- Testes de login.
- Testes de backend.
- Testes de isolamento por tenant.
- Testes de bloqueio por licença no servidor.
