import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Econ" },
      { name: "description", content: "Colunas e índices econômicos interativos sobre o Brasil." },
      { property: "og:title", content: "The Econ" },
      { property: "og:description", content: "Colunas e índices econômicos interativos sobre o Brasil." },
    ],
  }),
  component: Index,
});

function Index() {
  const { data: columns } = useQuery({
    queryKey: ["home", "columns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("columns")
        .select("id,title,subtitle,slug,category,cover_url,published_at")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(4);
      if (error) throw error;
      return data;
    },
  });

  const { data: indexes } = useQuery({
    queryKey: ["home", "indexes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("indexes")
        .select("id,name,slug,description,level,unit_label")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data;
    },
  });

  const [featured, ...rest] = columns ?? [];

  return (
    <PublicLayout>
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="border-b border-[var(--editorial-rule)] pb-8 mb-10">
          <div className="text-xs uppercase tracking-widest text-accent mb-3">
            The Econ · Edição corrente
          </div>
          <h1 className="font-serif text-4xl md:text-6xl leading-[1.05] tracking-tight max-w-4xl">
            Economia brasileira lida pelos dados.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
            Colunas editoriais e índices econômicos interativos sobre estados e
            municípios brasileiros, em um só lugar.
          </p>
        </div>

        {featured && (
          <Link
            to="/colunas/$slug"
            params={{ slug: featured.slug }}
            className="group grid md:grid-cols-2 gap-8 mb-12 pb-12 border-b border-[var(--editorial-rule)]"
          >
            {featured.cover_url ? (
              <div className="aspect-[4/3] overflow-hidden rounded-md bg-muted">
                <img
                  src={featured.cover_url}
                  alt={featured.title}
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                />
              </div>
            ) : (
              <div className="aspect-[4/3] bg-muted rounded-md" />
            )}
            <div className="flex flex-col justify-center">
              {featured.category && (
                <div className="text-xs uppercase tracking-widest text-accent mb-3">
                  {featured.category}
                </div>
              )}
              <h2 className="font-serif text-3xl md:text-4xl leading-tight group-hover:text-primary transition-colors">
                {featured.title}
              </h2>
              {featured.subtitle && (
                <p className="mt-3 text-muted-foreground text-lg line-clamp-3">
                  {featured.subtitle}
                </p>
              )}
              {featured.published_at && (
                <p className="text-xs text-muted-foreground mt-4">
                  {new Date(featured.published_at).toLocaleDateString("pt-BR", {
                    day: "2-digit", month: "long", year: "numeric",
                  })}
                </p>
              )}
            </div>
          </Link>
        )}

        <div className="grid md:grid-cols-3 gap-10">
          <section className="md:col-span-2">
            <div className="flex items-baseline justify-between mb-5 border-b border-[var(--editorial-rule)] pb-2">
              <h2 className="font-serif text-2xl">Colunas recentes</h2>
              <Link to="/colunas" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                Ver todas <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {rest.length === 0 && !featured && (
              <p className="text-muted-foreground text-sm">
                Em breve, as primeiras análises publicadas aparecerão aqui.
              </p>
            )}
            <div className="grid sm:grid-cols-2 gap-6">
              {rest.map((c) => (
                <Link key={c.id} to="/colunas/$slug" params={{ slug: c.slug }} className="group block">
                  {c.cover_url && (
                    <div className="aspect-[16/10] overflow-hidden rounded-md bg-muted mb-3">
                      <img src={c.cover_url} alt={c.title} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500" loading="lazy" />
                    </div>
                  )}
                  {c.category && (
                    <div className="text-[10px] uppercase tracking-widest text-accent font-medium mb-1">
                      {c.category}
                    </div>
                  )}
                  <h3 className="font-serif text-lg leading-snug group-hover:text-primary transition-colors">
                    {c.title}
                  </h3>
                </Link>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-baseline justify-between mb-5 border-b border-[var(--editorial-rule)] pb-2">
              <h2 className="font-serif text-2xl">Índices</h2>
              <Link to="/indices" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                Ver todos <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {(!indexes || indexes.length === 0) && (
              <p className="text-muted-foreground text-sm">
                Mapas coropléticos construídos a partir de planilhas e dados oficiais.
              </p>
            )}
            <div className="space-y-3">
              {indexes?.map((i) => (
                <Link key={i.id} to="/indices/$slug" params={{ slug: i.slug }} className="block border rounded-md p-4 bg-card hover:border-primary transition">
                  <div className="flex items-start gap-3">
                    <BarChart3 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <div className="font-serif text-base leading-tight">{i.name}</div>
                      <div className="text-[11px] text-muted-foreground mt-1">
                        {i.level === "state" ? "Estados" : "Municípios"}
                        {i.unit_label ? ` · ${i.unit_label}` : ""}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </PublicLayout>
  );
}
