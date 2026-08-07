# Release notes — Reset e preparação comercial

## Entregas

- Rota `/reset` para limpeza segura do ambiente demonstrativo.
- Utilitário centralizado para limpar chaves locais do MVP.
- Testes unitários adicionados ao pipeline.
- Smoke tests atualizados para cobrir reset.
- Roadmap comercial documentado.
- Checklist de deploy documentado.
- Comparação arquitetural com versão Java documentada.

## Impacto

O MVP fica mais seguro para demonstrações comerciais, pois agora é possível voltar rapidamente ao estado inicial sem intervenção técnica local.

## Limitação conhecida

O reset limpa somente dados do navegador local. Banco real, autenticação e autorização backend seguem como próximas fases do roadmap comercial.
