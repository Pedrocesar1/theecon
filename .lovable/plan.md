## Plano

1. **Corrigir as rotas de listagem do admin**
   - Ajustar as rotas `admin.colunas.index` e `admin.indices.index` para não dependerem de caminho com barra final (`/admin/colunas/` e `/admin/indices/`).
   - Isso evita que os links sejam tratados como se estivessem indo para a tela errada ou voltando para o dashboard.

2. **Tornar os botões de criação determinísticos**
   - Trocar os links dos botões “Nova coluna” e “Novo índice” para navegação explícita via clique, usando `navigate({ to: ... })`.
   - Aplicar nos botões do dashboard e nas telas de listagem.

3. **Verificar se as telas novas carregam de fato**
   - Confirmar que `/admin/colunas/new` mostra o editor.
   - Confirmar que `/admin/indices/new` mostra o construtor de índice.
   - Checar console e rede depois dos cliques para garantir que não há erro silencioso.

## Detalhes técnicos

O comportamento visto indica que a navegação está ficando presa/ambígua entre `/admin`, `/admin/colunas`, `/admin/indices` e as rotas `new`. A correção será focada apenas na navegação e no roteamento admin; não vou recriar telas nem trocar por dados mockados.