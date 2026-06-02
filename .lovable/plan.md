## Diagnóstico

Sintoma: clicar em "Nova coluna" ou "Novo índice" mostra um carregando e volta para o admin/login.

Causa raiz: `ColumnForm` importa `RichTextEditor` (TipTap) e `IndexWizard` importa `xlsx`, `ChoroplethMapClient` (Leaflet) e Recharts. Esses módulos quebram durante o SSR/prerender do TanStack Start. Resultado: a runtime error `SSR rendering failed` é disparada, o hidrate falha e o `_authenticated` AuthGate, sem sessão válida no momento do erro, devolve para `/admin/login`.

As páginas de edição (`/admin/colunas/$id`, `/admin/indices/$id`) sofrem do mesmo problema — só não foram testadas ainda.

Já existe no projeto o padrão correto: `src/components/ChoroplethMapClient.tsx` faz `lazy()` + guard `mounted` para evitar SSR de Leaflet. Vamos replicar.

## Mudanças

1. Criar `src/components/admin/ColumnFormClient.tsx`
   - `lazy(() => import("./ColumnForm"))`
   - Guard `useEffect(() => setMounted(true), [])`
   - Fallback "Carregando editor…" enquanto não montado

2. Criar `src/components/admin/IndexWizardClient.tsx`
   - Mesma estrutura, envolvendo `IndexWizard`

3. Trocar os imports nos 4 route files do admin:
   - `src/routes/_authenticated/admin.colunas.new.tsx` → usa `ColumnFormClient`
   - `src/routes/_authenticated/admin.colunas.$id.tsx` → usa `ColumnFormClient`
   - `src/routes/_authenticated/admin.indices.new.tsx` → usa `IndexWizardClient`
   - `src/routes/_authenticated/admin.indices.$id.tsx` → usa `IndexWizardClient`

Nenhuma lógica de negócio muda; só a fronteira de carregamento dos módulos só-browser.

## Verificação

- Após aplicar: navegar para `/admin/colunas/new` carrega o editor TipTap sem erro.
- Navegar para `/admin/indices/new` carrega o wizard XLSX/mapa sem erro.
- Editar coluna/índice existente continua funcionando.
- Console não exibe mais `SSR rendering failed`.
