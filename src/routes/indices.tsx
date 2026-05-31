import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { BarChart3 } from "lucide-react";

export const Route = createFileRoute("/indices")({
  head: () => ({
    meta: [
      { title: "Índices | The Econ" },
      { name: "description", content: "Índices econômicos interativos sobre o Brasil." },
    ],
  }),
  component: IndicesPage,
});

function IndicesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["public", "indexes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("indexes")
        .select("id,name,slug,description,level,unit_label,published_at")
        .eq("status", "published")
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <PublicLayout>
      <div className="max-w-5xl mx-auto px-4 py-12">
        <h1 className="font-serif text-4xl mb-2">Índices</h1>
        <p className="text-muted-foreground mb-8">
          Indicadores econômicos visualizados em mapas do Brasil.
        </p>

        {isLoading && (
          <p className="text-muted-foreground text-sm">Carregando...</p>
        )}
        {!isLoading && (!data || data.length === 0) && (
          <p className="text-muted-foreground">Nenhum índice publicado ainda.</p>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          {data?.map((i) => (
            <Link
              key={i.id}
              to="/indices/$slug"
              params={{ slug: i.slug }}
              className="border rounded-lg p-5 bg-card hover:border-primary transition"
            >
              <BarChart3 className="h-5 w-5 text-primary mb-2" />
              <h2 className="font-serif text-xl">{i.name}</h2>
              {i.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {i.description}
                </p>
              )}
              <div className="text-xs text-muted-foreground mt-3">
                {i.level === "state" ? "Estados" : "Municípios"}
                {i.unit_label ? ` · ${i.unit_label}` : ""}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </PublicLayout>
  );
}
