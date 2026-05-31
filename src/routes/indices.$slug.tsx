import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { ChoroplethMapClient } from "@/components/ChoroplethMapClient";
import type { IndexRow } from "@/components/admin/IndexDataInput";
import type { ClassMethod } from "@/lib/classify";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/indices/$slug")({
  component: IndiceDetail,
});

function IndiceDetail() {
  const { slug } = Route.useParams();
  const { data, isLoading, error } = useQuery({
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

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="max-w-5xl mx-auto px-4 py-12 text-muted-foreground">
          Carregando...
        </div>
      </PublicLayout>
    );
  }

  if (error || !data) {
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

  const rows = (Array.isArray(data.data) ? (data.data as unknown as IndexRow[]) : []);
  const sorted = [...rows].sort((a, b) => b.value - a.value);

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
              <ChoroplethMapClient
                geojsonUrl={data.geojson_url}
                joinKey={data.join_key ?? "code"}
                rows={rows}
                colorScheme={data.color_scheme}
                nClasses={data.n_classes}
                method={data.classification_method as ClassMethod}
                unitLabel={data.unit_label}
                height={600}
              />
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
