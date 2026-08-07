# Critérios de aceite da próxima fase backend

- Usuário faz login real.
- Usuário pertence a um tenant.
- Usuário pertence a uma ou mais unidades.
- Secretária não acessa dados sensíveis por URL direta.
- Licença bloqueada impede chamadas protegidas no backend.
- Dados de tenants diferentes não se misturam.
- Auditoria persiste em banco.
- Reset demonstrativo não existe para dados reais de produção.
