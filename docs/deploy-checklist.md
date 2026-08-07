# Deploy checklist

## Antes do merge

- PR aberto contra `main`.
- CI verde.
- Unit tests verdes.
- Smoke tests verdes.
- Build de produção verde.

## Depois do merge

- Aguardar deploy automático da Vercel.
- Abrir `https://clinicflow-psico.vercel.app/`.
- Validar carregamento da home.
- Abrir `/reset`.
- Abrir `/ajb-admin`.
- Confirmar que o produto não está quebrado visualmente.

## Critério de pronto para revisão visual

- Home carrega.
- `/reset` carrega.
- `/ajb-admin` carrega.
- Nenhuma tela crítica retorna erro de aplicação.
- CI do commit mergeado está verde ou o build da Vercel concluiu com sucesso.
