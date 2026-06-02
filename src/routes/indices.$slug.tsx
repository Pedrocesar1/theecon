import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { ChoroplethMapClient } from "@/components/ChoroplethMapClient";
import type { ClassMethod } from "@/lib/classify";

type IndexRow = { code: string; name?: string | null; value: number };
type RawRow = {
  ibge_code?: string;
  code?: string;
  ibge_name?: string | null;
  name?: string | null;
  value: number | null;
};
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IndexHistogram } from "@/components/IndexHistogram";

const indexQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: ["public", "index", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("indexes")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const Route = createFileRoute("/indices/$slug")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(indexQueryOptions(params.slug)),
  head: ({ loaderData, params }) => {
    const title = loaderData?.name
      ? `${loaderData.name} | The Econ`
      : "Índice | The Econ";
    const description =
      loaderData?.description ??
      "Índice econômico interativo do The Econ.";
    const url = `https://theecon.lovable.app/indices/${params.slug}`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
      ],
    };
  },
  component: IndiceDetail,
  errorComponent: ({ error }) => (
    <PublicLayout>
      <div className="max-w-5xl mx-auto px-4 py-12">
        <h1 className="font-serif text-3xl">Erro ao carregar índice</h1>
        <p className="text-muted-foreground mt-2">{error.message}</p>
      </div>
    </PublicLayout>
  ),
});

function IndiceDetail() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(indexQueryOptions(slug));

  if (!data) {
    return (
      <PublicLayout>
        <div className="max-w-5xl mx-auto px-4 py-12">
          <h1 className="font-serif text-3xl">Índice não encontrado</h1>
          <p className="text-muted-foreground mt-2">
            O índice solicitado não está disponível.
          </p>
        </div>
      </PublicLayout>
    );
  }

  const raw = (Array.isArray(data.data) ? (data.data as unknown as RawRow[]) : []);
  const rows: IndexRow[] = raw
    .filter((r) => r.value != null && Number.isFinite(r.value))
    .map((r) => ({
      code: (r.ibge_code ?? r.code ?? "") as string,
      name: r.ibge_name ?? r.name ?? null,
      value: r.value as number,
    }));
  const sorted = [...rows].sort((a, b) => b.value - a.value);
  const values = rows.map((r) => r.value).filter((v) => Number.isFinite(v));

  return (
    <PublicLayout>
      <article className="max-w-5xl mx-auto px-4 py-12">
        <header className="mb-8">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            {data.level === "state" ? "Por estado" : "Por município"}
            {data.unit_label ? ` · ${data.unit_label}` : ""}
          </div>
          <h1 className="font-serif text-4xl mb-3">{data.name}</h1>
          {data.description && (
            <p className="text-lg text-muted-foreground">{data.description}</p>
          )}
        </header>

        <Tabs defaultValue="map">
          <TabsList>
            <TabsTrigger value="map">Mapa</TabsTrigger>
            <TabsTrigger value="data">Dados</TabsTrigger>
            {data.methodology && (
              <TabsTrigger value="methodology">Metodologia</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="map" className="pt-4">
            {data.geojson_url ? (
              <div className="space-y-4">
                <ChoroplethMapClient
                  geojsonUrl={data.geojson_url}
                  joinKey={data.join_key ?? "code"}
                  rows={rows}
                  colorScheme={data.color_scheme}
                  nClasses={data.n_classes}
                  method={data.classification_method as ClassMethod}
                  unitLabel={data.unit_label}
                  height={600}
                  exportFileName={data.slug}
                />
                {values.length > 0 && (
                  <IndexHistogram
                    values={values}
                    method={data.classification_method as ClassMethod}
                    nClasses={data.n_classes}
                    colorScheme={data.color_scheme}
                    unitLabel={data.unit_label}
                  />
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">Mapa indisponível.</p>
            )}
          </TabsContent>

          <TabsContent value="data" className="pt-4">
            <div className="border rounded-md max-h-[600px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">Código</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead className="w-32 text-right">
                      {data.unit_label ?? "Valor"}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map((r, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-mono text-xs">{r.code}</TableCell>
                      <TableCell>{r.name ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        {r.value.toLocaleString("pt-BR", { maximumFractionDigits: 4 })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {data.methodology && (
            <TabsContent value="methodology" className="pt-4">
              <div className="prose-editorial max-w-3xl whitespace-pre-wrap">
                {data.methodology}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </article>
    </PublicLayout>
  );
}
