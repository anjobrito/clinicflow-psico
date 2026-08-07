# Critérios de aceite do reset

- A rota `/reset` existe.
- A rota `/reset` abre mesmo com licença local bloqueada.
- O botão de reset só habilita após digitar `RESETAR`.
- O reset remove todas as chaves locais documentadas.
- O reset dispara eventos para atualizar licença, consultórios e auditoria.
- Após resetar, abrir `/` volta ao estado inicial demonstrativo.
- O CI cobre a existência do reset por unit tests e smoke tests.
