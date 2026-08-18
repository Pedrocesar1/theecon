# Redesign visual do mapa coroplético (/indices/:slug)

Toda a lógica de dados, classificação (Jenks/intervalos iguais), GeoJSON do IBGE e políticas de acesso permanecem intactas. As mudanças ficam em `ChoroplethMap.tsx` e componentes novos de apresentação.

## Observação sobre o item 6
Hoje a página de índice tem apenas as abas Mapa / Dados / Metodologia — **não existe ranking top10/bottom10 nem busca**. Para o `flyTo` fazer sentido, esses controles serão criados nesta fase (painel lateral do mapa com busca por nome/código e listas Top 10 / Bottom 10).

## O que será feito

1. **Base do mapa**: troca do OpenStreetMap por CartoDB Positron (claro). Botão "modo terminal" no canto do mapa alterna para CartoDB Dark Matter, com a paleta de bordas/legendas se adaptando ao fundo escuro.

2. **Sem dado**: polígonos sem valor recebem cinza neutro com hachura diagonal sutil (SVG pattern injetado no painel do Leaflet), visualmente distinto de qualquer classe da paleta. Entrada própria na legenda.

3. **Tooltip customizado**: remoção do `bindTooltip` nativo. Um tooltip React único, ancorado ao cursor via portal, com nome do local em Playfair Display, valor em destaque em Inter, e mini barra de gradiente marcando a posição do valor na escala. Estado único garante que nunca haja dois tooltips abertos.

4. **Hover nos polígonos**: em vez de troca de cor, o polígono ativo ganha borda glow, drop-shadow e leve realce (via filtro SVG e ajuste de peso/opacidade), com transição suave.

5. **Legenda**: barra de gradiente contínua fixa no canto inferior direito, fundo semitransparente com blur, marcador que acompanha o valor sob o cursor no mapa, e clique por faixa para destacar/filtrar as áreas daquela classe (clique de novo limpa o filtro).

6. **Navegação suave**: painel de busca (com debounce) e listas Top 10 / Bottom 10 ao lado do mapa; clicar em um item usa `flyTo`/`fitBounds` animado até o polígono, que pisca em destaque.

7. **Skeleton**: enquanto o GeoJSON carrega, um skeleton com a identidade editorial do projeto (silhueta do mapa + barras de legenda pulsando), substituindo o texto "Carregando mapa..." também no wrapper client.

## Detalhes técnicos
- Instalar `framer-motion` para as transições de tooltip, legenda e painel.
- Novos arquivos: `MapTooltip.tsx`, `MapLegend.tsx`, `MapSkeleton.tsx`, `MapRankingPanel.tsx`; `ChoroplethMap.tsx` passa a orquestrar esses componentes e a manter refs do Leaflet por código IBGE para o `flyTo`.
- Cores e tipografia usam tokens do design system em `src/styles.css` (sem cores hardcoded).
- Exportação PNG continua funcionando: os novos overlays em HTML são ignorados/serializados conforme necessário no `html2canvas`.
- Nenhuma alteração em `src/lib/classify.ts`, `indexProcessing.ts`, schema ou RLS.
