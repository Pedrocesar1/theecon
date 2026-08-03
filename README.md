# The Econ Chronicle

# PRD Lovable - The Econ

## 1. Objetivo

Construir uma aplicacao web completa chamada **The Econ**, voltada para um estudante de economia que publica colunas editoriais e indices economicos interativos em mapas coropleticos do Brasil.

A aplicacao deve ter duas areas principais:

- **Site publico**, para leitores acessarem colunas, indices e mapas.
- **Painel administrativo privado**, para o autor criar, editar, publicar e gerenciar todo o conteudo.

O produto deve parecer um jornal economico digital moderno: editorial, limpo, confiavel, responsivo e orientado a dados.

## 2. Stack obrigatoria

Use:

- React + TypeScript em strict mode.
- Vite.
- Lovable Cloud como backend nativo: banco de dados, autenticacao, storage, funcoes serverless/edge e politicas de acesso.
- Tailwind CSS.
- shadcn/ui para componentes base.
- React Router v6.
- Zustand ou React Context para sessao/autenticacao.
- React Hook Form + Zod para formularios.
- TipTap para editor rico das colunas.
- SheetJS para leitura de `.xlsx` e `.csv` no cliente.
- Leaflet + react-leaflet para mapas.
- Recharts para graficos simples, como histograma.
- simple-statistics para classificacao Jenks/natural breaks.
- html2canvas para exportar mapa como PNG, com cuidado especifico para CORS dos tiles.
- react-helmet-async para SEO.

Nao conectar um projeto Supabase externo. Use Lovable Cloud para toda persistencia, autenticacao e arquivos. Durante desenvolvimento, componentes podem ter estados vazios, loading e erro, mas as operacoes principais devem ler e gravar no Lovable Cloud.

### Pacotes TipTap obrigatorios

Instalar e usar estes pacotes npm para o editor de colunas:

```txt
@tiptap/react
@tiptap/starter-kit
@tiptap/extension-underline
@tiptap/extension-link
@tiptap/extension-image
@tiptap/extension-text-align
@tiptap/extension-placeholder
@tiptap/extension-dropcursor
@tiptap/extension-gapcursor
```

Uso esperado:

- `@tiptap/starter-kit`: documento, paragrafo, texto, negrito, italico, tachado, headings, listas, blockquote, code, history e hard break.
- `@tiptap/extension-underline`: sublinhado.
- `@tiptap/extension-link`: links com validacao de URL.
- `@tiptap/extension-image`: imagens inline.
- `@tiptap/extension-text-align`: alinhamento para headings e paragrafos.
- `@tiptap/extension-placeholder`: placeholder editorial no editor vazio.
- `@tiptap/extension-dropcursor` e `@tiptap/extension-gapcursor`: melhor experiencia ao inserir imagens e blocos.

## 3. Arquitetura esperada

Organize o projeto assim:

```txt
src/
  components/
    admin/
    columns/
    indexes/
    layout/
    maps/
    editor/
    ui/
  hooks/
    useAuth.ts
    useColumns.ts
    useIndexes.ts
    useStorage.ts
  lib/
    backend.ts
    slug.ts
    dates.ts
    indexes/
      normalize.ts
      classify.ts
      csv.ts
      stats.ts
  pages/
    public/
    admin/
  routes/
    AppRoutes.tsx
    ProtectedRoute.tsx
  types/
    column.ts
    index.ts
    geo.ts
```

Todas as chamadas ao backend do Lovable Cloud devem ficar encapsuladas em hooks ou funcoes de `lib/`. Evite chamadas soltas dentro de componentes grandes.

## 4. Rotas

### Publicas

- `/` - home editorial com destaque para colunas recentes e indices publicados.
- `/colunas` - listagem paginada de colunas publicadas.
- `/colunas/:slug` - pagina de leitura de uma coluna.
- `/indices` - listagem de indices publicados.
- `/indices/:slug` - pagina publica do indice com mapa interativo.

### Home publica

A home `/` deve ter hierarquia editorial clara, sem parecer landing page generica:

1. Header fixo ou topo simples com logo `The Econ`, links para `Colunas` e `Indices`, e botao discreto de login/admin apenas se adequado.
2. Bloco principal acima da dobra com a coluna publicada mais recente ou marcada como destaque: titulo grande, subtitulo, categoria, data e imagem de capa se houver.
3. Coluna lateral ou faixa secundaria com duas ou tres colunas recentes menores.
4. Secao `Indices economicos` logo abaixo do destaque, com cards dos indices publicados mais recentes, mostrando nome, descricao curta, nivel geografico, data e miniatura/preview do mapa.
5. Secao `Ultimas colunas` com lista densa de artigos recentes, paginavel ou com link para `/colunas`.
6. Rodape simples com nome do projeto, descricao curta e links principais.

Em mobile, a ordem deve ser: header, coluna destaque, indices recentes, ultimas colunas, rodape. Evitar hero abstrato, gradiente decorativo ou texto promocional sem conteudo real.

### Admin

- `/admin/login` - login por email e senha via Lovable Cloud Auth.
- `/admin` - dashboard simples com atalhos e contadores.
- `/admin/colunas` - listagem de colunas.
- `/admin/colunas/nova` - criacao de coluna.
- `/admin/colunas/:id/editar` - edicao de coluna.
- `/admin/indices` - listagem de indices.
- `/admin/indices/novo` - construtor de indice.
- `/admin/indices/:id/editar` - edicao de indice.

Todas as rotas `/admin/*`, exceto `/admin/login`, devem exigir usuario autenticado.

## 5. Modelo de dados Lovable Cloud

Crie as tabelas abaixo no Lovable Cloud Database. Use migracoes/politicas de acesso do Lovable Cloud para garantir que visitantes anonimos leiam apenas conteudo publicado e que apenas usuarios autenticados consigam criar, editar ou excluir.

Se o Lovable criar o schema pela interface visual em vez de SQL manual, manter exatamente os mesmos campos, tipos, constraints e relacoes logicas descritos abaixo.

```sql
create type public.content_status as enum ('draft', 'published');
create type public.geo_level as enum ('state', 'municipality');
create type public.classification_method as enum ('equal_intervals', 'jenks');

create table public.columns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  slug text not null unique,
  category text,
  cover_url text,
  content_html text,
  inline_assets jsonb not null default '[]'::jsonb,
  status public.content_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.indexes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  methodology text,
  level public.geo_level not null,
  color_scheme text not null default 'viridis',
  n_classes int not null default 5 check (n_classes between 3 and 7),
  classification_method public.classification_method not null default 'equal_intervals',
  unit_label text default 'Indice 0-1',
  variables jsonb not null default '[]'::jsonb,
  data jsonb not null default '[]'::jsonb,
  status public.content_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger columns_set_updated_at
before update on public.columns
for each row execute function public.set_updated_at();

create trigger indexes_set_updated_at
before update on public.indexes
for each row execute function public.set_updated_at();
```

### Tipo TypeScript para `indexes.data`

O campo `indexes.data` deve armazenar um array JSON com este formato explicito:

```ts
export type IndexGeoLevel = 'state' | 'municipality';

export type IndexVariableValue = {
  raw: number | null;
  normalized: number | null;
  weight: number;
};

export type IndexDataRow = {
  ibge_code: string; // UF: 2 digitos; municipio: 7 digitos.
  ibge_name: string;
  value: number | null; // indice composto final, normalmente entre 0 e 1.
  variables: Record<string, IndexVariableValue>;
  class_index?: number | null; // 0 ate n_classes - 1; null para sem dado.
  class_label?: string | null; // exemplo: "0.200 - 0.400".
};

export type IndexData = IndexDataRow[];
```

Regras:

- `ibge_code` sempre deve ser string para preservar codigos e evitar perda de zeros ou conversoes indevidas.
- `value = null` representa localidade sem dado e deve aparecer em cinza no mapa.
- `variables` deve guardar, por variavel original, o valor bruto, o valor normalizado e o peso usado no calculo.
- `class_index` e `class_label` podem ser recalculados no cliente, mas devem ser salvos quando o indice for publicado para acelerar o carregamento publico.

### Politicas de acesso

Regras:

- Visitantes anonimos podem ler apenas registros com `status = 'published'`.
- Usuarios autenticados podem ler, inserir, atualizar e excluir todos os registros.

Implementar essas regras como politicas no Lovable Cloud Database. Se o Lovable expuser SQL compativel com row-level security, usar a estrutura abaixo como referencia de politica:

```sql
alter table public.columns enable row level security;
alter table public.indexes enable row level security;

create policy "Public can read published columns"
on public.columns for select
using (status = 'published');

create policy "Authenticated users manage columns"
on public.columns for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

create policy "Public can read published indexes"
on public.indexes for select
using (status = 'published');

create policy "Authenticated users manage indexes"
on public.indexes for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');
```

### Lovable Cloud Storage

Criar buckets:

- `covers` para imagens de capa.
- `inline-images` para imagens inseridas no editor.
- `geojson` para arquivos GeoJSON simplificados, se nao usar CDN externa.

Politicas:

- Leitura publica para arquivos publicados.
- Upload, update e delete apenas para usuarios autenticados.

## 6. Modulo de colunas

### Site publico

`/colunas` deve exibir:

- Grid responsivo de cards.
- Titulo, subtitulo, categoria, data de publicacao e imagem de capa quando existir.
- Filtro por categoria.
- Paginacao de 10 itens por pagina.
- Estados de loading, erro e vazio.

`/colunas/:slug` deve exibir:

- SEO dinamico com titulo, descricao e imagem.
- Titulo, subtitulo, categoria e data.
- Imagem de capa.
- Conteudo HTML do TipTap com tipografia editorial.
- Layout centralizado, largura de leitura confortavel e boa experiencia mobile.

### Admin

`/admin/colunas` deve exibir:

- Tabela com titulo, categoria, status, data de atualizacao e acoes.
- Acoes: criar, editar, publicar, despublicar e excluir.
- Confirmacao antes de excluir.
- Busca por titulo.

Formulario de coluna:

- Titulo obrigatorio.
- Subtitulo opcional.
- Slug gerado automaticamente pelo titulo, mas editavel.
- Categoria/tag.
- Upload de imagem de capa para Lovable Cloud Storage.
- Editor TipTap com negrito, italico, sublinhado, tachado, H2, H3, listas, blockquote, links, imagens inline e alinhamento.
- Botoes: `Salvar rascunho` e `Publicar`.
- Ao publicar, definir `status = 'published'` e `published_at = now()` quando ainda nao existir.
- Ao salvar rascunho, manter ou definir `status = 'draft'`.

### Estrategia para imagens inline no TipTap

Imagens inline inseridas no corpo da coluna devem usar Lovable Cloud Storage.

Fluxo obrigatorio:

1. Na toolbar do TipTap, o botao de imagem abre um modal com duas abas: `Upload` e `URL`.
2. Upload aceita `image/jpeg`, `image/png`, `image/webp` e `image/gif`, com limite recomendado de 5 MB por arquivo.
3. Se a coluna ainda nao tiver `id`, salvar automaticamente um rascunho minimo primeiro para obter `column.id`.
4. Enviar o arquivo para Lovable Cloud Storage no caminho:

```txt
inline-images/columns/{columnId}/{uuid}.{ext}
```

5. Apos upload bem-sucedido, inserir no editor um node `Image` com `src`, `alt` e `title`.
6. Salvar a URL e os metadados em `columns.inline_assets`, por exemplo:

```json
[
  {
    "url": "https://...",
    "path": "inline-images/columns/{columnId}/{uuid}.webp",
    "alt": "Descricao da imagem",
    "uploaded_at": "2026-05-30T00:00:00.000Z"
  }
]
```

7. Imagens inline devem ter leitura publica para que colunas publicadas renderizem corretamente. Upload, update e delete devem continuar restritos a usuario autenticado.
8. Ao excluir uma coluna, excluir tambem as imagens em `inline_assets`. Ao remover uma imagem do editor, manter o arquivo ate o proximo salvamento e limpar assets orfaos de forma segura.

## 7. Modulo de indices economicos

O construtor de indices deve funcionar em quatro etapas claras.

### Etapa 1 - Upload e preview

Permitir upload de `.xlsx` ou `.csv` usando SheetJS.

Depois do upload:

- Exibir preview das primeiras 10 linhas.
- Detectar nomes das colunas.
- Permitir escolher a coluna de codigo IBGE.
- Permitir escolher uma ou mais variaveis numericas.
- Validar que codigos IBGE nao estejam vazios.
- Validar que variaveis escolhidas tenham valores numericos suficientes.
- Exibir erros claros para arquivo vazio, formato invalido ou coluna invalida.

### Etapa 2 - Normalizacao e pesos

Para cada variavel selecionada:

- Calcular minimo, maximo, media e mediana.
- Aplicar normalizacao Min-Max:

```txt
valor_normalizado = (x - min) / (max - min)
```

Se `max = min`, tratar a variavel como constante e atribuir `0` para todos os registros, mostrando aviso.

Permitir pesos personalizados:

- Cada variavel deve ter peso entre 0 e 1.
- A soma dos pesos deve ser exatamente 1, com tolerancia de 0.001.
- Exibir erro quando a soma for invalida.
- Calcular indice composto:

```txt
indice = soma(peso_da_variavel * valor_normalizado_da_variavel)
```

Exibir:

- Estatisticas por variavel.
- Preview dos registros calculados.
- Histograma simples do indice final.

### Etapa 3 - Configuracao do mapa

Campos obrigatorios:

- Nome do indice.
- Slug editavel, gerado pelo nome.
- Descricao curta.
- Metodologia.
- Nivel geografico: `state` ou `municipality`.
- Esquema de cores.
- Numero de classes entre 3 e 7.
- Metodo de classificacao: intervalos iguais ou Jenks.
- Rotulo da unidade, exemplo: `Indice 0-1`.
- Status: rascunho ou publicado.

Paletas minimas:

- Viridis.
- Blues.
- Greens.
- Oranges.
- Red-Yellow-Green divergente.

### Etapa 4 - Visualizacao e publicacao

Renderizar mapa com Leaflet e GeoJSON do IBGE.

#### Fontes GeoJSON oficiais do IBGE

Usar a API oficial de Malhas Geograficas do IBGE como fonte primaria. A documentacao oficial fica em:

```txt
https://servicodados.ibge.gov.br/api/docs/malhas?versao=3
```

URLs reais recomendadas:

```txt
# Brasil dividido por UFs
https://servicodados.ibge.gov.br/api/v3/malhas/paises/BR?intrarregiao=UF&qualidade=minima&formato=application%2Fvnd.geo%2Bjson

# Brasil dividido por municipios
https://servicodados.ibge.gov.br/api/v3/malhas/paises/BR?intrarregiao=municipio&qualidade=minima&formato=application%2Fvnd.geo%2Bjson

# Municipios de uma UF especifica, usando sigla ou codigo da UF
https://servicodados.ibge.gov.br/api/v3/malhas/estados/{UF}?intrarregiao=municipio&qualidade=minima&formato=application%2Fvnd.geo%2Bjson

# Malha de um municipio individual
https://servicodados.ibge.gov.br/api/v3/malhas/municipios/{codigo_ibge}?qualidade=minima&formato=application%2Fvnd.geo%2Bjson
```

Observacoes:

- O valor `formato=application%2Fvnd.geo%2Bjson` e a versao URL-encoded de `application/vnd.geo+json`.
- Se o fetch nao respeitar o parametro `formato`, enviar tambem header `Accept: application/vnd.geo+json`.
- A propriedade do codigo IBGE pode variar conforme a resposta (`codarea`, `id`, `CD_MUN`, etc.). Implementar um helper `getFeatureIbgeCode(feature)` tolerante a essas variacoes.

#### Estrategia de hospedagem para municipios

Nao buscar a malha nacional de todos os municipios diretamente do IBGE em todo carregamento publico.

Estrategia obrigatoria:

1. Usar a API do IBGE como fonte de verdade.
2. Baixar uma vez a malha de municipios em qualidade minima.
3. Salvar arquivos estaticos no Lovable Cloud Storage, com leitura publica:

```txt
geojson/ibge/br-ufs-min.geojson
geojson/ibge/municipios/br-municipios-min.geojson
geojson/ibge/municipios/uf/{UF}-municipios-min.geojson
```

4. Para indices estaduais, carregar `br-ufs-min.geojson`.
5. Para indices municipais nacionais, preferir arquivo unico simplificado se o tamanho compactado for aceitavel; se ficar pesado, carregar por UF sob demanda.
6. Para indices municipais de recorte regional ou estadual, carregar apenas o arquivo da UF correspondente.
7. Manter fallback: se o arquivo do Storage falhar, tentar a URL oficial do IBGE e exibir aviso discreto.
8. Versionar arquivos quando necessario, por exemplo `br-municipios-min-2026-05.geojson`, para evitar cache antigo.

Obrigatorio:

- Carregar GeoJSON de forma lazy apenas na pagina do indice.
- Unir dados ao GeoJSON pelo codigo IBGE.
- Pintar geometrias por classe.
- Zoom e pan com mouse/touch.
- Tooltip no hover com nome, codigo IBGE e valor do indice com 3 casas decimais.
- Legenda fixa no canto inferior direito.
- Legenda clicavel para filtrar/destacar uma faixa.
- Botao de reset de filtro.
- Busca com debounce de 300ms para localizar municipio/estado.
- Painel lateral colapsavel com top 10 e bottom 10.
- Download dos dados em CSV.
- Download do mapa como PNG usando html2canvas ou biblioteca equivalente.

#### Export PNG e CORS dos tiles Leaflet

O download PNG pode falhar ou sair em branco quando o html2canvas tenta capturar tiles Leaflet de terceiros, porque imagens sem CORS correto "contaminam" o canvas do navegador.

Implementar uma destas solucoes:

1. Solucao preferida: no modo exportacao, ocultar/remover temporariamente a camada de tiles e exportar apenas o mapa vetorial GeoJSON, legenda, titulo e painel essencial.
2. Alternativa: usar apenas tiles servidos com CORS adequado e configurar `crossOrigin: true` no `TileLayer`.
3. Alternativa avancada: servir tiles/rasters por proxy ou asset proprio no Lovable Cloud com header `Access-Control-Allow-Origin`.

Configuracao minima do html2canvas:

```ts
await html2canvas(mapContainer, {
  useCORS: true,
  allowTaint: false,
  backgroundColor: '#ffffff',
});
```

Se a exportacao falhar por CORS, mostrar mensagem clara e oferecer exportacao sem mapa-base, preservando poligonos, cores, legenda e dados.

## 8. Comportamento de classificacao

Implementar em `src/lib/indexes/classify.ts`.

Intervalos iguais:

- Dividir o range `[min, max]` pelo numero de classes.
- Incluir o valor maximo na ultima classe.

Jenks:

- Usar `simple-statistics` com o pacote npm `simple-statistics`.
- Se Jenks falhar por dados insuficientes, cair para intervalos iguais e mostrar aviso discreto.

Exemplo de uso esperado:

```ts
import { jenks } from 'simple-statistics';

export function getJenksBreaks(values: number[], nClasses: number): number[] {
  const cleanValues = values
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b);

  const uniqueValues = new Set(cleanValues);

  if (cleanValues.length < nClasses || uniqueValues.size < nClasses) {
    return getEqualIntervalBreaks(cleanValues, nClasses);
  }

  return jenks(cleanValues, nClasses);
}
```

`jenks(values, nClasses)` deve retornar um array de quebras com minimo, limites intermediarios e maximo. Usar essas quebras para montar classes no formato `[breaks[i], breaks[i + 1]]`, incluindo o valor maximo na ultima classe.

Registros sem valor:

- Devem aparecer em cinza neutro.
- Tooltip deve mostrar `Sem dado`.
- Nao entram no ranking top/bottom.

## 9. Design

Identidade:

- Editorial, economica, limpa e orientada a dados.
- Titulos com Playfair Display.
- Corpo com Inter.
- Fundo branco ou quase branco.
- Texto preto/cinza escuro.
- Accent principal em indigo ou verde-oliva, usado com parcimonia.

Diretrizes:

- Site publico deve lembrar um jornal digital economico, nao uma landing page.
- Home deve abrir com conteudo real: manchete/coluna em destaque e indices recentes.
- Admin deve ser mais denso, funcional e silencioso, com sidebar fixa.
- Mobile-first.
- Evitar cards decorativos em excesso.
- Nao usar hero generico com gradiente.
- Garantir que textos nao estourem em botoes, cards, tabelas ou legendas.

## 10. Estados obrigatorios

Toda operacao assincrona deve ter:

- Loading.
- Erro.
- Vazio.
- Sucesso quando aplicavel.

Casos especificos:

- Lista sem colunas publicadas.
- Lista sem indices publicados.
- Arquivo invalido no upload.
- Planilha sem coluna numerica.
- Pesos que nao somam 1.
- GeoJSON nao carregado.
- Indice publicado sem dados validos.
- Falha de upload no Lovable Cloud Storage.
- Usuario nao autenticado tentando acessar admin.

## 11. SEO

Usar `react-helmet-async`.

Colunas:

- Title: `{titulo} | The Econ`.
- Description: subtitulo ou resumo.
- Open Graph com imagem de capa se existir.

Indices:

- Title: `{nome} | The Econ`.
- Description: descricao curta.

Listagens:

- Titles claros: `Colunas | The Econ`, `Indices | The Econ`.

## 12. Performance

- Lazy-load das paginas administrativas pesadas.
- Lazy-load do mapa e GeoJSON.
- Debounce de 300ms na busca.
- Paginacao em colunas.
- Evitar renderizar todos os municipios desnecessariamente fora da pagina do mapa.
- Usar GeoJSON simplificado para municipios.
- Memoizar calculos de classificacao, ranking e estatisticas.

## 13. Criterios de aceite

O app sera considerado pronto quando:

- Login Lovable Cloud funcionar.
- Rotas admin estiverem protegidas.
- Admin conseguir criar, editar, publicar, despublicar e excluir colunas.
- Colunas publicadas aparecerem no site publico.
- Conteudo TipTap renderizar corretamente na pagina publica.
- Upload de capa salvar no Lovable Cloud Storage.
- Admin conseguir criar indice a partir de `.xlsx` ou `.csv`.
- Preview da planilha, selecao de colunas, normalizacao, pesos e histograma funcionarem.
- Pesos invalidos bloquearem publicacao.
- Mapa publico renderizar GeoJSON real com cores por classe.
- GeoJSON de estados/municipios vir da API oficial do IBGE e ser cacheado/hospedado no Lovable Cloud Storage para uso publico.
- Classificacao Jenks usar `simple-statistics` e cair para intervalos iguais quando houver dados insuficientes.
- Tooltip, legenda, busca, top/bottom ranking e downloads funcionarem.
- Download PNG funcionar mesmo com restricoes de CORS dos tiles, usando exportacao sem mapa-base quando necessario.
- Visitantes anonimos conseguirem ler apenas conteudo publicado.
- Politicas de acesso impedirem escrita anonima no banco.
- App responsivo funcionar em mobile, tablet e desktop.

## 14. Prompt mestre para colar no Lovable

Use este prompt como primeira mensagem:

```md
Construa uma aplicacao web completa chamada The Econ, usando React, TypeScript, Lovable Cloud, Tailwind, shadcn/ui, React Router, TipTap, SheetJS, Leaflet, Recharts, simple-statistics e html2canvas.

The Econ e um jornal economico digital pessoal com duas areas: um site publico para leitores acessarem colunas e indices economicos interativos, e um painel admin privado para o autor criar, editar e publicar conteudo.

Siga rigorosamente este PRD:

1. Crie as rotas publicas: /, /colunas, /colunas/:slug, /indices, /indices/:slug.
2. Crie as rotas admin: /admin/login, /admin, /admin/colunas, /admin/colunas/nova, /admin/colunas/:id/editar, /admin/indices, /admin/indices/novo, /admin/indices/:id/editar.
3. Use Lovable Cloud Auth para login por email/senha e proteja todas as rotas /admin/*.
4. Crie hooks para Lovable Cloud: useAuth, useColumns, useIndexes e useStorage.
5. Crie tabelas columns e indexes no Lovable Cloud Database com politicas de acesso: publico le apenas published; autenticado gerencia tudo.
6. Implemente colunas com editor TipTap, upload de capa, status draft/published, slug automatico editavel e pagina publica editorial.
7. Implemente imagens inline no TipTap via Lovable Cloud Storage, salvando metadados em columns.inline_assets.
8. Implemente indices com upload de xlsx/csv via SheetJS, preview, selecao de codigo IBGE, selecao de variaveis, normalizacao Min-Max, pesos que somam 1, histograma, configuracao de mapa e publicacao.
9. Use o tipo TypeScript IndexData para indexes.data, com ibge_code, ibge_name, value, variables, class_index e class_label.
10. Implemente mapa com Leaflet + react-leaflet, GeoJSON oficial do IBGE, cache/hospedagem dos arquivos municipais no Lovable Cloud Storage, tooltip, legenda clicavel, busca com debounce, ranking top 10/bottom 10, download CSV e download PNG.
11. Use simple-statistics para Jenks/natural breaks, com fallback para intervalos iguais.
12. Trate o problema de CORS do html2canvas com tiles Leaflet: no modo exportacao, ocultar mapa-base externo ou usar tiles com CORS adequado.
13. Use design editorial: Playfair Display para titulos, Inter para corpo, fundo branco, texto escuro e accent indigo ou verde-oliva. O site publico deve parecer um jornal economico moderno; o admin deve ser funcional, denso e claro.
14. Todas as operacoes devem ter loading, erro e vazio. Nao deixe fluxos principais com dados mockados.

Priorize uma implementacao robusta e componentizada. Crie primeiro a estrutura, autenticacao, schema Lovable Cloud e modulo de colunas. Em seguida implemente o construtor de indices e o mapa. Mantenha o codigo tipado, organizado e facil de evoluir.
```

## 15. Sequencia recomendada de prompts para Lovable

### Prompt 1 - Base, Lovable Cloud e layout

```md
Implemente a base do The Econ: estrutura de pastas, React Router, cliente/backend nativo do Lovable Cloud, AuthProvider/useAuth, ProtectedRoute, layout publico, layout admin com sidebar, tela de login e dashboard admin. Crie tambem as tabelas columns e indexes no Lovable Cloud Database com politicas de acesso conforme o PRD, incluindo columns.inline_assets e indexes.data no formato TypeScript IndexData. Nao conecte Supabase externo. Nao implemente ainda o construtor completo de indices; deixe a rota preparada.
```

### Prompt 2 - Modulo de colunas

```md
Agora implemente o modulo completo de colunas: home publica editorial, listagem publica /colunas, detalhe /colunas/:slug, listagem admin, formulario de criacao/edicao, TipTap com toolbar completa, upload de capa no Lovable Cloud Storage, imagens inline via Lovable Cloud Storage em inline-images/columns/{columnId}/{uuid}.{ext}, status draft/published, slug automatico editavel, filtros por categoria, paginacao e SEO com react-helmet-async.
```

### Prompt 3 - Upload e calculo dos indices

```md
Implemente as etapas 1 e 2 do construtor de indices: upload xlsx/csv com SheetJS, preview das primeiras 10 linhas, selecao da coluna IBGE, selecao de variaveis numericas, estatisticas descritivas, normalizacao Min-Max, pesos personalizados que precisam somar 1, calculo do indice composto no formato TypeScript IndexData e histograma com Recharts. Crie funcoes puras em src/lib/indexes para normalizacao, estatisticas, classificacao e export CSV. Instale e use simple-statistics para Jenks/natural breaks.
```

### Prompt 4 - Mapa e publicacao

```md
Implemente as etapas 3 e 4 do construtor de indices e a pagina publica /indices/:slug: configuracao de nome, slug, descricao, metodologia, nivel geografico, paleta, numero de classes, metodo de classificacao e status; salvar tudo no Lovable Cloud Database; usar as URLs oficiais do GeoJSON do IBGE; cachear/hospedar arquivos de municipios no Lovable Cloud Storage; carregar GeoJSON de forma lazy; renderizar mapa Leaflet coropletico com tooltip, legenda clicavel, busca com debounce, reset de filtro, ranking top/bottom, download CSV e download PNG. Para PNG, trate CORS dos tiles Leaflet ocultando o mapa-base externo no modo exportacao ou usando tiles com CORS adequado.
```

### Prompt 5 - QA e hardening

```md
Revise o app inteiro contra o PRD. Corrija estados de loading, erro e vazio. Garanta responsividade mobile/tablet/desktop. Valide politicas de acesso, rotas protegidas, publicacao/despublicacao, pesos invalidos, planilhas invalidas, GeoJSON sem match e registros sem dado. Remova mocks dos fluxos finais. Ajuste tipagem TypeScript e componentes grandes demais.
```

## 16. Observacoes importantes para Lovable

- Use Lovable Cloud como backend principal. Nao pedir conexao com Supabase externo, Firebase ou outro BaaS.
- Ao lidar com mapas de municipios, usar GeoJSON simplificado para evitar travamentos.
- Se algum recurso pesado falhar em uma unica iteracao, dividir em componentes menores antes de continuar.
- Preservar sempre a diferenca entre `draft` e `published`.
- Nunca mostrar conteudo `draft` no site publico.
- Priorizar funcionamento real antes de refinamentos visuais.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://theecon.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/523b2f65-b188-4f73-ad5b-d15db3a58d9f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
